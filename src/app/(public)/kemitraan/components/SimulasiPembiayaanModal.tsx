// src/app/(public)/kemitraan/components/SimulasiPembiayaanModal.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Landmark,
  Calculator,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  FileText,
  User,
  Phone,
  Mail,
  CreditCard,
  Building,
} from 'lucide-react';
import { formatRupiah } from '@/utils/format';
import { FinancingScheme } from '@/types/partnership.types';
import { useFinancingMutations } from '@/hooks/useFinancing';

interface SimulasiPembiayaanModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedScheme?: FinancingScheme | null;
  schemes: FinancingScheme[];
}

const PROGRAM_OPTIONS = [
  { id: 'cnc-presisi', name: 'Manufaktur CNC 5-Axis Presisi', fee: 12500000, avgSalary: 7500000 },
  { id: 'underwater-welding', name: 'Underwater & GTAW Specialist Welding', fee: 14000000, avgSalary: 9500000 },
  { id: 'ai-academy', name: 'Akademi AI & Machine Learning Engineering', fee: 8500000, avgSalary: 8000000 },
  { id: 'cyber-security', name: 'Cyber Security Defense Specialist', fee: 9000000, avgSalary: 8500000 },
  { id: 'fullstack-cloud', name: 'Fullstack Web & Cloud Engineering', fee: 7500000, avgSalary: 6500000 },
  { id: 'iot-mechatronics', name: 'Otomasi Industri & Robotika IoT', fee: 10000000, avgSalary: 7000000 },
  { id: 'digital-marketing', name: 'Digital Marketing & Content Creator', fee: 5500000, avgSalary: 5000000 },
];

export default function SimulasiPembiayaanModal({
  isOpen,
  onClose,
  selectedScheme,
  schemes,
}: SimulasiPembiayaanModalProps) {
  const { submitApplicationMutation } = useFinancingMutations();

  // Selected state
  const [activeSchemeId, setActiveSchemeId] = useState<string>(
    selectedScheme?.id || (schemes.length > 0 ? schemes[0].id || '' : '')
  );
  const [selectedProgramId, setSelectedProgramId] = useState<string>(PROGRAM_OPTIONS[0].id);
  const [tenorMonths, setTenorMonths] = useState<number>(6);

  // Form submission state
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantNik, setApplicantNik] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('Fresh Graduate / Pencari Kerja');
  const [proposalNote, setProposalNote] = useState('');

  // Active scheme
  const currentScheme = useMemo(() => {
    return schemes.find((s) => s.id === activeSchemeId) || selectedScheme || schemes[0];
  }, [schemes, activeSchemeId, selectedScheme]);

  // Active program
  const currentProgram = useMemo(() => {
    return PROGRAM_OPTIONS.find((p) => p.id === selectedProgramId) || PROGRAM_OPTIONS[0];
  }, [selectedProgramId]);

  // Perhitungan simulasi angsuran
  const calculation = useMemo(() => {
    if (!currentScheme || !currentProgram) {
      return { monthlyInstallment: 0, totalPayment: 0, interestAmount: 0 };
    }

    const principal = currentProgram.fee;

    // Beasiswa 100% atau Voucher
    if (currentScheme.schemeType === 'BEASISWA_PENUH' || currentScheme.schemeType === 'VOUCHER_PELATIHAN') {
      return {
        monthlyInstallment: 0,
        totalPayment: 0,
        interestAmount: 0,
        subsidyCoverage: 100,
      };
    }

    const months = tenorMonths > 0 ? tenorMonths : (currentScheme.tenorMonths || 6);
    const annualInterestPercent = currentScheme.interestRate || 0;

    if (annualInterestPercent === 0) {
      // Cicilan 0%
      const monthly = Math.round(principal / months);
      return {
        monthlyInstallment: monthly,
        totalPayment: principal,
        interestAmount: 0,
        subsidyCoverage: 0,
      };
    }

    // KUR / Pinjaman Lunak flat sederhana
    const totalInterest = Math.round(principal * (annualInterestPercent / 100) * (months / 12));
    const total = principal + totalInterest;
    const monthly = Math.round(total / months);

    return {
      monthlyInstallment: monthly,
      totalPayment: total,
      interestAmount: totalInterest,
      subsidyCoverage: 0,
    };
  }, [currentScheme, currentProgram, tenorMonths]);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentScheme || !currentProgram) return;

    if (!applicantName.trim() || !applicantPhone.trim() || !applicantEmail.trim()) {
      return;
    }

    const res = await submitApplicationMutation.mutateAsync({
      schemeId: currentScheme.id || 'custom-scheme',
      schemeTitle: currentScheme.title,
      partnerId: currentScheme.partnerId,
      partnerName: currentScheme.partnerName,
      applicantName,
      applicantEmail,
      applicantPhone,
      applicantNik: applicantNik || undefined,
      programId: currentProgram.id,
      programTitle: currentProgram.name,
      trainingFee: currentProgram.fee,
      requestedAmount: currentProgram.fee,
      preferredTenor: tenorMonths,
      employmentStatus,
      proposalNote: proposalNote || undefined,
    });

    if (res.success) {
      setIsApplying(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-3xl border-slate-200 bg-white">
        {/* Header Visual */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 p-6 md:p-8 text-white relative">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Landmark className="w-5 h-5" />
            </span>
            <Badge className="bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-200 border-none font-bold text-[11px]">
              Simulasi Cerdas Pembiayaan
            </Badge>
          </div>
          <DialogTitle className="text-xl md:text-2xl font-black tracking-tight">
            Kalkulator & Pengajuan Fasilitas Pembiayaan
          </DialogTitle>
          <DialogDescription className="text-xs text-indigo-200/80 mt-1 max-w-xl">
            Hitung perkiraan angsuran pendidikan vokasi Anda atau ajukan beasiswa industri terakreditasi Solo Technopark tanpa kerumitan birokrasi.
          </DialogDescription>
        </div>

        <div className="p-6 md:p-8 max-h-[75vh] overflow-y-auto space-y-6">
          {!isApplying ? (
            <>
              {/* Opsi Skema Bank / Fintech */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  1. Pilih Mitra Lembaga Keuangan / Skema Bantuan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {schemes.map((scheme) => {
                    const isSelected = (currentScheme?.id || '') === scheme.id;
                    return (
                      <button
                        key={scheme.id}
                        type="button"
                        onClick={() => {
                          setActiveSchemeId(scheme.id || '');
                          if (scheme.tenorMonths) setTenorMonths(scheme.tenorMonths);
                        }}
                        className={`text-left p-3.5 rounded-2xl border transition-all relative ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 shadow-sm ring-2 ring-indigo-600/10'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {scheme.partnerName}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-[9px] font-black shrink-0 ${
                              scheme.interestRate === 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {scheme.interestRate === 0 ? 'Bunga 0% / Beasiswa' : `Bunga ${scheme.interestRate}%/Th`}
                          </Badge>
                        </div>
                        <p className="text-xs font-bold text-indigo-950 line-clamp-1">{scheme.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{scheme.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opsi Program Pelatihan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    2. Program Pelatihan yang Diminati
                  </label>
                  <select
                    value={selectedProgramId}
                    onChange={(e) => setSelectedProgramId(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {PROGRAM_OPTIONS.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.name} ({formatRupiah(prog.fee)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    3. Pilihan Tenor Angsuran
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 6, 9, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        disabled={currentScheme?.schemeType === 'BEASISWA_PENUH'}
                        onClick={() => setTenorMonths(m)}
                        className={`h-11 rounded-xl border text-xs font-black transition-all ${
                          tenorMonths === m && currentScheme?.schemeType !== 'BEASISWA_PENUH'
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40'
                        }`}
                      >
                        {m} Bln
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hasil Kalkulasi & ROI Card */}
              <div className="bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 border border-indigo-100 rounded-3xl p-5 md:p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100/80 pb-4">
                  <div>
                    <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wider">
                      Estimasi Angsuran Bulanan
                    </span>
                    <div className="text-2xl md:text-3xl font-black text-slate-950 mt-1">
                      {currentScheme?.schemeType === 'BEASISWA_PENUH' || currentScheme?.schemeType === 'VOUCHER_PELATIHAN' ? (
                        <span className="text-emerald-700">GRATIS (Disponsori 100%)</span>
                      ) : (
                        <>
                          {formatRupiah(calculation.monthlyInstallment)}
                          <span className="text-xs text-slate-500 font-bold ml-1.5">/ bulan ({tenorMonths}x)</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 font-bold block">Biaya Diklat Resmi</span>
                    <span className="text-sm font-black text-slate-800">
                      {formatRupiah(currentProgram?.fee)}
                    </span>
                  </div>
                </div>

                {/* ROI Insight Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Perbandingan ROI Gaji Lulusan</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Rata-rata pendapatan awal alumni bidang ini berkisar{' '}
                        <strong className="text-emerald-700">{formatRupiah(currentProgram?.avgSalary)}</strong>. Angsuran hanya memakan ~{Math.round((calculation.monthlyInstallment / (currentProgram?.avgSalary || 1)) * 100)}% gaji.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Jaminan Legalitas & Transparansi</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Dikelola resmi melalui kemitraan UPT Solo Technopark dengan OJK/Bank resmi. Tanpa potongan tersembunyi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl text-xs font-bold"
                >
                  Tutup
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsApplying(true)}
                  className="rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-md shadow-indigo-600/20"
                >
                  <span>Lanjutkan Formulir Pengajuan</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            /* Formulir Data Diri Calon Peserta */
            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between text-xs">
                <div>
                  <p className="text-slate-500 font-medium">Skema yang dipilih:</p>
                  <p className="font-black text-slate-900">{currentScheme?.title} ({currentScheme?.partnerName})</p>
                  <p className="text-indigo-700 font-bold mt-0.5">{currentProgram?.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsApplying(false)}
                  className="text-xs font-bold text-indigo-600 underline"
                >
                  Ubah Opsi
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nama Lengkap (Sesuai KTP) *</label>
                  <Input
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    className="rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">NIK KTP *</label>
                  <Input
                    required
                    value={applicantNik}
                    onChange={(e) => setApplicantNik(e.target.value)}
                    placeholder="16 digit NIK"
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nomor WhatsApp Aktif *</label>
                  <Input
                    required
                    type="tel"
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Email Aktif *</label>
                  <Input
                    required
                    type="email"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Status Aktivitas Saat Ini</label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                >
                  <option value="Fresh Graduate / Pencari Kerja">Fresh Graduate / Pencari Kerja</option>
                  <option value="Freelancer / Pekerja Lepas">Freelancer / Pekerja Lepas</option>
                  <option value="Karyawan Swasta / BUMN">Karyawan Swasta / BUMN</option>
                  <option value="Mahasiswa Tingkat Akhir">Mahasiswa Tingkat Akhir</option>
                  <option value="Wirausaha / UMKM">Wirausaha / UMKM</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Motivasi & Komitmen Belajar</label>
                <textarea
                  rows={2}
                  value={proposalNote}
                  onChange={(e) => setProposalNote(e.target.value)}
                  placeholder="Jelaskan alasan mengapa Anda membutuhkan fasilitas ini dan rencana karir Anda setelah lulus..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsApplying(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  Kembali ke Simulasi
                </Button>
                <Button
                  type="submit"
                  disabled={submitApplicationMutation.isPending}
                  className="rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-md shadow-indigo-600/20"
                >
                  {submitApplicationMutation.isPending ? 'Mengirimkan...' : 'Kirim Pengajuan Pembiayaan'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

