'use client';

import React, { useState } from 'react';
import { TrainingBatch } from '@/types';
import { toast } from 'sonner';
import {
  UserPlus,
  X,
  CheckCircle2,
  Loader2,
  Building,
  Mail,
  Phone,
  IdCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ModalQuickWalkinParticipantProps {
  isOpen: boolean;
  onClose: () => void;
  batches: TrainingBatch[];
  selectedBatchId?: string;
  onRegister: (batchId: string, batchNumber: number, participant: any) => Promise<any>;
}

export default function ModalQuickWalkinParticipant({
  isOpen,
  onClose,
  batches,
  selectedBatchId: initialBatchId,
  onRegister,
}: ModalQuickWalkinParticipantProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    initialBatchId || batches[0]?.id || ''
  );
  const [name, setName] = useState('');
  const [nik, setNik] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [origin, setOrigin] = useState('');
  const [fundingScheme, setFundingScheme] = useState<string>('OFFLINE_WALKIN');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return toast.error('Nama lengkap peserta wajib diisi');
    if (!phone.trim()) return toast.error('Nomor WhatsApp wajib diisi');

    // Auto generate email jika peserta tidak memiliki email
    let finalEmail = email.trim();
    if (!finalEmail) {
      const sanitizedPhone = phone.replace(/[^0-9]/g, '');
      finalEmail = `peserta.${sanitizedPhone || Date.now()}@peserta.solotechnopark.id`;
    }

    if (!currentBatch) {
      toast.error('Silakan pilih batch pelatihan');
      return;
    }

    setIsSubmitting(true);
    try {
      const participant = {
        name: name.trim(),
        nik: nik.trim(),
        email: finalEmail.toLowerCase(),
        phone: phone.trim(),
        origin: origin.trim() || 'Umum / Loket STP',
        registrationSource: fundingScheme,
        customData: {
          nik: nik.trim(),
          loketInputBy: 'Petugas CS Solo Technopark',
        },
      };

      await onRegister(currentBatch.id, currentBatch.batchNumber, [participant]);
      toast.success(`Peserta "${name}" berhasil didaftarkan ke Batch ${currentBatch.batchNumber}!`);
      onClose();
    } catch (err: any) {
      // Error ditangani oleh mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header Modal */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Tambah Peserta Offline / Walk-in</h2>
              <p className="text-xs text-slate-400">Registrasi cepat loket Solo Technopark</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Pilihan Batch */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Batch Target *
            </Label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  Batch {b.batchNumber} ({b.year}) — {b.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Nama Lengkap Peserta *</Label>
            <Input
              required
              placeholder="Contoh: Muhammad Ilham Pratama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">NIK KTP (16 Digit)</Label>
              <Input
                placeholder="337201..."
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                className="h-10 text-xs font-mono rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Nomor WhatsApp *</Label>
              <Input
                required
                placeholder="081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 text-xs font-mono rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Alamat Email</Label>
            <Input
              type="email"
              placeholder="nama@email.com (Kosongkan bila dibuat otomatis)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Asal Instansi / Sekolah</Label>
              <Input
                placeholder="SMK / Perusahaan / Umum"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Jalur Pendanaan</Label>
              <select
                value={fundingScheme}
                onChange={(e) => setFundingScheme(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="OFFLINE_WALKIN">Mandiri (Kasir STP)</option>
                <option value="PARTNER_DINAS">Beasiswa Pemkot / Dinas</option>
                <option value="PARTNER_SMK">Program Vokasi SMK</option>
                <option value="PARTNER_CSR">Sponsor CSR Industri</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl text-xs">
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Daftarkan Peserta</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
