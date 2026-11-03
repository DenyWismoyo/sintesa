// src/app/mitra/financing/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  FileText,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/AuthContext';
import { useMyPartnerProfile } from '@/hooks/usePartners';
import {
  useAllFinancingSchemes,
  useFinancingApplications,
  useFinancingMutations,
} from '@/hooks/useFinancing';
import {
  FinancingScheme,
  FinancingSchemeType,
  FinancingApplication,
  FINANCING_SCHEME_LABELS,
} from '@/types/partnership.types';
import { formatRupiah } from '@/utils/format';
import { toast } from 'sonner';

export default function MitraFinancingPage() {
  const { user, partnerId } = useAuth();
  const { data: partnerProfile } = useMyPartnerProfile(user?.uid, partnerId);
  const effectivePartnerId = partnerProfile?.id || partnerId || user?.uid || '';

  const { data: mySchemes = [], isLoading: isLoadingSchemes } = useAllFinancingSchemes();
  const { data: applications = [], isLoading: isLoadingApps } = useFinancingApplications();
  const { createSchemeMutation, updateApplicationStatusMutation } = useFinancingMutations();

  // Create Scheme Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [schemeType, setSchemeType] = useState<FinancingSchemeType>('KUR_BANK');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxAmount, setMaxAmount] = useState<number>(20000000);
  const [tenorMonths, setTenorMonths] = useState<number>(12);
  const [interestRate, setInterestRate] = useState<number>(3.0);
  const [eligibilityCriteria, setEligibilityCriteria] = useState('');
  const [quotaTotal, setQuotaTotal] = useState<number>(50);

  // Tab View: SCHEMES vs APPLICANTS
  const [activeTab, setActiveTab] = useState<'APPLICANTS' | 'SCHEMES'>('APPLICANTS');
  const [searchApplicant, setSearchApplicant] = useState('');

  // Handle Create Scheme
  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Lengkapi nama dan deskripsi skema.');
      return;
    }

    const res = await createSchemeMutation.mutateAsync({
      partnerId: effectivePartnerId,
      partnerName: partnerProfile?.companyName || user?.displayName || 'Mitra Keuangan STP',
      partnerLogo: partnerProfile?.companyLogo,
      schemeType,
      title,
      description,
      maxAmount,
      tenorMonths,
      interestRate,
      eligiblePrograms: ['Manufaktur CNC Presisi', 'Welding Specialist', 'Akademi AI'],
      eligibilityCriteria: eligibilityCriteria || 'KTP WNI, usia min 18 tahun, lolos seleksi Solo Technopark',
      quotaTotal,
      quotaUsed: 0,
      isActive: true,
      isFeatured: false,
    });

    if (res.success) {
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
    }
  };

  const handleUpdateStatus = async (appId: string, status: any, note?: string) => {
    await updateApplicationStatusMutation.mutateAsync({
      id: appId,
      status,
      notes: { bankReviewNotes: note || `Diverifikasi oleh ${partnerProfile?.companyName || 'Mitra Bank'}` },
    });
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        app.applicantName.toLowerCase().includes(searchApplicant.toLowerCase()) ||
        app.programTitle.toLowerCase().includes(searchApplicant.toLowerCase()) ||
        (app.applicantEmail && app.applicantEmail.toLowerCase().includes(searchApplicant.toLowerCase()));
      return matchSearch;
    });
  }, [applications, searchApplicant]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-[11px] font-bold">
            <Landmark className="w-3.5 h-3.5" />
            <span>Fasilitas Pembiayaan & Perbankan Pelatihan</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            Portal Penyaluran KUR, Cicilan & Beasiswa Vokasi
          </h1>
          <p className="text-xs text-indigo-100/80 max-w-2xl leading-relaxed">
            Pantau pengajuan pembiayaan pendidikan peserta pelatihan dari Solo Technopark, verifikasi kelayakan kredit, dan kelola kuota produk pembiayaan institusi Anda.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-11 px-5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs gap-2 shadow-lg shadow-indigo-500/25 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Skema Baru</span>
          </Button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('APPLICANTS')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'APPLICANTS'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Daftar Calon Penerima ({applications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SCHEMES')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'SCHEMES'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Katalog Skema Pembiayaan ({mySchemes.length})
          </button>
        </div>

        {activeTab === 'APPLICANTS' && (
          <div className="w-64">
            <Input
              value={searchApplicant}
              onChange={(e) => setSearchApplicant(e.target.value)}
              placeholder="Cari nama / email / program..."
              className="h-9 text-xs rounded-xl"
            />
          </div>
        )}
      </div>

      {/* VIEW 1: DAFTAR PELAMAR PEMBIAYAAN */}
      {activeTab === 'APPLICANTS' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          {isLoadingApps ? (
            <div className="p-12 text-center text-xs text-slate-400">Memuat data pengajuan...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Landmark className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Belum ada pengajuan pembiayaan yang masuk</p>
              <p className="text-[11px] text-slate-400">
                Pengajuan dari calon peserta pelatihan via halaman publik akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {filteredApplications.map((app) => (
                <div key={app.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">{app.applicantName}</span>
                      <Badge
                        variant="secondary"
                        className={`text-[9px] font-bold ${
                          app.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'BANK_PROCESSING'
                            ? 'bg-blue-100 text-blue-800'
                            : app.status === 'FORWARDED_BANK'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {app.status}
                      </Badge>
                    </div>
                    <p className="text-slate-500">
                      Program: <strong className="text-indigo-950">{app.programTitle}</strong> (Biaya: {formatRupiah(app.trainingFee)})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Kontak: {app.applicantPhone} | {app.applicantEmail} | NIK: {app.applicantNik || '-'}
                    </p>
                    {app.proposalNote && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl mt-1.5 italic">
                        "{app.proposalNote}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(app.id || '', 'BANK_PROCESSING', 'Dalam proses scoring')}
                      className="rounded-xl text-[11px] font-bold"
                    >
                      Proses Verifikasi
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleUpdateStatus(app.id || '', 'APPROVED', 'Disetujui pembiayaan kredit')}
                      className="rounded-xl text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                      Setujui Pembiayaan
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUpdateStatus(app.id || '', 'REJECTED', 'Tidak memenuhi kriteria')}
                      className="rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                    >
                      Tolak
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: KATALOG SKEMA PEMBIAYAAN */}
      {activeTab === 'SCHEMES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mySchemes.map((scheme) => (
            <div key={scheme.id} className="p-5 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] font-bold">
                  {FINANCING_SCHEME_LABELS[scheme.schemeType] || scheme.schemeType}
                </Badge>
                <span className="text-[10px] font-bold text-indigo-700">
                  {scheme.interestRate === 0 ? 'Bunga 0%' : `${scheme.interestRate}%/Tahun`}
                </span>
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900">{scheme.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{scheme.description}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plafon Maksimal:</span>
                  <strong className="text-slate-900">{formatRupiah(scheme.maxAmount)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tenor:</span>
                  <strong className="text-slate-900">{scheme.tenorMonths} Bulan</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pemanfaatan Kuota:</span>
                  <strong className="text-indigo-700">{scheme.quotaUsed} / {scheme.quotaTotal}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Skema */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border-slate-200 bg-white">
          <div className="bg-slate-900 p-6 text-white">
            <DialogTitle className="text-lg font-black">Tambah Produk Skema Pembiayaan</DialogTitle>
            <p className="text-xs text-slate-400 mt-1">
              Skema ini akan langsung muncul di kalkulator pembiayaan publik Solo Technopark.
            </p>
          </div>

          <form onSubmit={handleCreateScheme} className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nama Produk Skema *</label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: KUR Vokasi Bank Jateng"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tipe Skema</label>
                <select
                  value={schemeType}
                  onChange={(e) => setSchemeType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                >
                  <option value="KUR_BANK">Kredit Pelatihan / KUR Bank</option>
                  <option value="CICILAN_0_PERSEN">Cicilan 0% Syariah / Fintech</option>
                  <option value="BEASISWA_PENUH">Beasiswa Penuh 100%</option>
                  <option value="BEASISWA_PARSIAL">Subsidi Beasiswa Sebagian</option>
                  <option value="VOUCHER_PELATIHAN">Voucher Bantuan Pemerintah</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Suku Bunga (% per tahun)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Plafon Maksimal (Rp)</label>
                <Input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(Number(e.target.value))}
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Maksimal Tenor (Bulan)</label>
                <Input
                  type="number"
                  value={tenorMonths}
                  onChange={(e) => setTenorMonths(Number(e.target.value))}
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Total Kuota Kursi</label>
                <Input
                  type="number"
                  value={quotaTotal}
                  onChange={(e) => setQuotaTotal(Number(e.target.value))}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Deskripsi Singkat *</label>
              <Textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan manfaat dan sasaran peserta dari skema ini..."
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Kriteria Kelayakan Peserta</label>
              <Textarea
                rows={2}
                value={eligibilityCriteria}
                onChange={(e) => setEligibilityCriteria(e.target.value)}
                placeholder="Contoh: KTP Jawa Tengah, melampirkan surat lolos seleksi STP..."
                className="rounded-xl text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createSchemeMutation.isPending}
                className="rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {createSchemeMutation.isPending ? 'Menyimpan...' : 'Simpan & Publikasikan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

