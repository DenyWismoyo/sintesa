// src/app/(admin)/manajemen-kemitraan/components/TabFinancingAdmin.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Landmark,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Filter,
  DollarSign,
  Users,
  Send,
  Building2,
  Trash2,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useAllFinancingSchemes,
  useFinancingApplications,
  useFinancingMutations,
} from '@/hooks/useFinancing';
import {
  FinancingApplication,
  FinancingScheme,
  FINANCING_SCHEME_LABELS,
} from '@/types/partnership.types';
import { formatRupiah, formatTanggal } from '@/utils/format';

export default function TabFinancingAdmin() {
  const { data: schemes = [], isLoading: isLoadingSchemes } = useAllFinancingSchemes();
  const { data: applications = [], isLoading: isLoadingApps } = useFinancingApplications();
  const { updateApplicationStatusMutation } = useFinancingMutations();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.programTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.partnerName && app.partnerName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || app.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  const handleUpdateStatus = async (id: string, status: any, note: string) => {
    await updateApplicationStatusMutation.mutateAsync({
      id,
      status,
      notes: { stpReviewNotes: note },
    });
  };

  return (
    <div className="space-y-6">
      {/* Ringkasan Skema Aktif */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {schemes.slice(0, 4).map((scheme) => (
          <div key={scheme.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-700 truncate">{scheme.partnerName}</span>
              <Badge variant="outline" className="text-[9px]">
                {scheme.interestRate === 0 ? 'Bunga 0%' : `${scheme.interestRate}%/Th`}
              </Badge>
            </div>
            <h5 className="text-xs font-black text-slate-900 line-clamp-1">{scheme.title}</h5>
            <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span>Kuota Terpakai:</span>
              <strong className="text-indigo-900">{scheme.quotaUsed} / {scheme.quotaTotal}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Top Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari pelamar / program / bank..."
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700"
          >
            <option value="ALL">Semua Status Permohonan</option>
            <option value="SUBMITTED">Baru Masuk (SUBMITTED)</option>
            <option value="STP_REVIEWED">Diverifikasi STP</option>
            <option value="FORWARDED_BANK">Diteruskan ke Bank</option>
            <option value="APPROVED">Disetujui Bank</option>
            <option value="REJECTED">Ditolak</option>
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Total: <strong className="text-slate-900">{filteredApps.length}</strong> Pengajuan
        </div>
      </div>

      {/* List Permohonan Pembiayaan */}
      {isLoadingApps ? (
        <div className="p-12 text-center text-xs text-slate-400">Memuat permohonan...</div>
      ) : filteredApps.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
          Tidak ada permohonan pembiayaan yang cocok dengan filter.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
          {filteredApps.map((app) => (
            <div key={app.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-slate-900">{app.applicantName}</span>
                  <Badge
                    variant="secondary"
                    className={`text-[9px] font-black ${
                      app.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : app.status === 'FORWARDED_BANK'
                        ? 'bg-indigo-100 text-indigo-800'
                        : app.status === 'STP_REVIEWED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {app.status}
                  </Badge>
                  <span className="text-[11px] font-bold text-indigo-700">
                    Mitra: {app.partnerName || 'Bank Mitra'}
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  Program: <strong className="text-slate-900">{app.programTitle}</strong> — Nilai Pembiayaan:{' '}
                  <strong className="text-emerald-700">{formatRupiah(app.trainingFee)}</strong> (Tenor: {app.preferredTenor} Bln)
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                  <span>Kontak: {app.applicantPhone} | {app.applicantEmail}</span>
                  <span>NIK: {app.applicantNik || '-'}</span>
                  <span>Status: {app.employmentStatus || '-'}</span>
                </div>

                {app.proposalNote && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl italic mt-1">
                    "{app.proposalNote}"
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {app.status === 'SUBMITTED' && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleUpdateStatus(app.id || '', 'STP_REVIEWED', 'Berkas KTP & Rekomendasi STP Terverifikasi')}
                    className="rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verifikasi Berkas</span>
                  </Button>
                )}

                {app.status === 'STP_REVIEWED' && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleUpdateStatus(app.id || '', 'FORWARDED_BANK', 'Diteruskan ke Unit Analisis Kredit Bank')}
                    className="rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Teruskan ke Bank</span>
                  </Button>
                )}

                {app.status === 'FORWARDED_BANK' && (
                  <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Menunggu Keputusan Bank
                  </span>
                )}

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleUpdateStatus(app.id || '', 'REJECTED', 'Tidak memenuhi kriteria')}
                  className="rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
                >
                  Tolak
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

