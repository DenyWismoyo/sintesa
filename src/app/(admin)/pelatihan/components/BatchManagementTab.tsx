'use client';

import React, { useState } from 'react';
import { Training, TrainingBatch } from '@/types';
import { useBatch } from '@/hooks/useBatch';
import {
  Calendar,
  Plus,
  Users,
  FileSpreadsheet,
  UserPlus,
  Sparkles,
  ChevronRight,
  Clock,
  Layers,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ModalImportPesertaBatch from './ModalImportPesertaBatch';
import ModalQuickWalkinParticipant from './ModalQuickWalkinParticipant';
import Link from 'next/link';

interface BatchManagementTabProps {
  training: Training;
}

export default function BatchManagementTab({ training }: BatchManagementTabProps) {
  const trainingId = training.id || '';
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const {
    batches,
    isLoading,
    initAnnualBatches,
    isInitializingBatches,
    createBatch,
    updateBatch,
    deleteBatch,
    bulkRegisterParticipants,
  } = useBatch(trainingId);

  // Filter batch sesuai tahun yang dipilih
  const yearBatches = batches.filter((b) => b.year === selectedYear);

  // State Modals
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isWalkinOpen, setIsWalkinOpen] = useState(false);
  const [targetBatchId, setTargetBatchId] = useState<string>('');

  const handleOpenImport = (batchId: string) => {
    setTargetBatchId(batchId);
    setIsImportOpen(true);
  };

  const handleOpenWalkin = (batchId: string) => {
    setTargetBatchId(batchId);
    setIsWalkinOpen(true);
  };

  const handleInitBatches = async () => {
    if (confirm(`Inisialisasi 4 Batch resmi untuk tahun ${selectedYear}? Batch 1 s/d 4 akan dibuat secara otomatis.`)) {
      await initAnnualBatches({ year: selectedYear });
    }
  };

  const handleStatusChange = async (batchId: string, newStatus: any) => {
    await updateBatch({ batchId, data: { status: newStatus } });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REGISTRATION_OPEN':
        return <Badge className="bg-emerald-600 text-white text-[10px]">Pendaftaran Buka</Badge>;
      case 'ONGOING':
        return <Badge className="bg-blue-600 text-white text-[10px]">Sedang Berjalan</Badge>;
      case 'COMPLETED':
        return <Badge variant="secondary" className="bg-slate-200 text-slate-700 text-[10px]">Selesai / Alumni</Badge>;
      case 'UPCOMING':
      default:
        return <Badge variant="outline" className="text-slate-500 border-slate-300 text-[10px]">Mendatang</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Bar Kontrol Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Manajemen 4 Batch Kuartalan ({selectedYear})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola pembagian kuota per kuartal, peserta delegasi dinas, rombongan SMK, dan walk-in
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value) || currentYear)}
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white outline-none"
          >
            <option value={2026}>Tahun Anggaran 2026</option>
            <option value={2027}>Tahun Anggaran 2027</option>
            <option value={2028}>Tahun Anggaran 2028</option>
          </select>

          {yearBatches.length === 0 && (
            <Button
              type="button"
              onClick={handleInitBatches}
              disabled={isInitializingBatches}
              className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Inisialisasi 4 Batch ({selectedYear})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid 4 Batch Kuartal */}
      {yearBatches.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Belum Ada Batch untuk Tahun {selectedYear}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Gunakan tombol inisialisasi di atas untuk langsung membuat struktur 4 Batch Kuartal (Jan–Mar, Apr–Jun, Jul–Sep, Okt–Des) secara otomatis.
          </p>
          <Button
            type="button"
            onClick={handleInitBatches}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs mt-2"
          >
            + Buat 4 Batch Kuartal Sekarang
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {yearBatches.map((batch) => {
            const quotaLeft = Math.max(0, batch.quota - batch.registeredCount);
            const percentage = Math.min(100, Math.round((batch.registeredCount / (batch.quota || 1)) * 100));

            return (
              <div
                key={batch.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Header Card */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-blue-700 uppercase tracking-wider">
                      BATCH {batch.batchNumber}
                    </span>
                    {getStatusBadge(batch.status)}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">
                    {batch.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{batch.startDate} s/d {batch.endDate}</span>
                  </p>
                </div>

                {/* Body Progress */}
                <div className="p-4 space-y-3 flex-1 text-xs">
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Keterisian Peserta:</span>
                      <span className="font-bold text-slate-800">
                        {batch.registeredCount} / {batch.quota} orang ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percentage >= 100 ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Batas Daftar:</span>
                      <span className="font-semibold text-slate-800">{batch.registrationDeadline}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Pendanaan:</span>
                      <span className="font-semibold text-emerald-700">{batch.fundingScheme}</span>
                    </div>
                  </div>

                  {/* Status Switcher Selector */}
                  <div className="pt-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Ubah Status Batch:
                    </label>
                    <select
                      value={batch.status}
                      onChange={(e) => handleStatusChange(batch.id, e.target.value)}
                      className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs font-semibold bg-white outline-none"
                    >
                      <option value="UPCOMING">Mendatang (Upcoming)</option>
                      <option value="REGISTRATION_OPEN">Pendaftaran Buka (Open)</option>
                      <option value="ONGOING">Sedang Berjalan (Ongoing)</option>
                      <option value="COMPLETED">Selesai / Lulus (Completed)</option>
                      <option value="ARCHIVED">Arsip</option>
                    </select>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-3 bg-slate-50/90 border-t border-slate-100 flex flex-col gap-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenImport(batch.id)}
                      className="h-8 rounded-lg border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-[11px] font-bold gap-1"
                      title="Import Excel Rombongan Dinas / SMK"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Import Excel</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenWalkin(batch.id)}
                      className="h-8 rounded-lg border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-[11px] font-bold gap-1"
                      title="Tambah Peserta Offline Loket Walk-in"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                      <span>Walk-in</span>
                    </Button>
                  </div>

                  <Link
                    href={`/pelatihan/${trainingId}/peserta?batch=${batch.batchNumber}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition-all"
                  >
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Evaluasi & Peserta Batch</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Import Excel Peserta */}
      {isImportOpen && (
        <ModalImportPesertaBatch
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          batches={yearBatches}
          selectedBatchId={targetBatchId}
          onImport={async (batchId, batchNumber, participants) => {
            return await bulkRegisterParticipants({ batchId, batchNumber, participants });
          }}
        />
      )}

      {/* Modal Quick Walkin Loket */}
      {isWalkinOpen && (
        <ModalQuickWalkinParticipant
          isOpen={isWalkinOpen}
          onClose={() => setIsWalkinOpen(false)}
          batches={yearBatches}
          selectedBatchId={targetBatchId}
          onRegister={async (batchId, batchNumber, participants) => {
            return await bulkRegisterParticipants({ batchId, batchNumber, participants });
          }}
        />
      )}
    </div>
  );
}
