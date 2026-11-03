// src/app/(admin)/manajemen-kemitraan/components/TabOpenProjectAdmin.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Filter,
  DollarSign,
  Users,
  AlertCircle,
  Building2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useAllOpenProjects,
  useOpenProjectMutations,
  useProjectApplications,
} from '@/hooks/useOpenProjects';
import {
  OpenProject,
  OpenProjectStatus,
  OPEN_PROJECT_CATEGORY_LABELS,
} from '@/types/partnership.types';
import { formatRupiah, formatTanggal } from '@/utils/format';
import { toast } from 'sonner';

export default function TabOpenProjectAdmin() {
  const { data: projects = [], isLoading } = useAllOpenProjects();
  const { reviewProjectMutation, deleteProjectMutation } = useOpenProjectMutations();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const { data: applicants = [] } = useProjectApplications(selectedProjectId || undefined);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.partnerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const handleApprove = async (id: string) => {
    await reviewProjectMutation.mutateAsync({
      id,
      status: 'ACTIVE',
      notes: 'Disetujui oleh Tim Kurator Kemitraan STP',
    });
  };

  const handleReject = async (id: string) => {
    await reviewProjectMutation.mutateAsync({
      id,
      status: 'CANCELLED',
      notes: 'Perlu revisi kelayakan kompensasi / ruang lingkup',
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus draf proyek ini?')) {
      await deleteProjectMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari judul proyek / nama mitra..."
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING_REVIEW">Menunggu Kurasi STP</option>
            <option value="ACTIVE">Aktif (Tayang)</option>
            <option value="IN_PROGRESS">Sedang Dikerjakan</option>
            <option value="COMPLETED">Selesai</option>
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Total: <strong className="text-slate-900">{filteredProjects.length}</strong> Proyek
        </div>
      </div>

      {/* Grid Proyek */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Memuat data proyek...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
          Tidak ada proyek yang sesuai filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((p) => {
            const isPending = p.status === 'PENDING_REVIEW';
            return (
              <div
                key={p.id}
                className={`p-5 rounded-3xl border transition-all bg-white ${
                  isPending ? 'border-amber-300 ring-2 ring-amber-400/10 shadow-sm' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {OPEN_PROJECT_CATEGORY_LABELS[p.category] || p.category}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-black ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPending
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {p.status}
                      </Badge>
                      <span className="text-[11px] font-bold text-slate-400">
                        Mitra: <strong className="text-slate-800">{p.partnerName}</strong>
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900">{p.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span>Kompensasi: <strong className="text-emerald-700">{formatRupiah(p.budgetAmount)}</strong></span>
                      <span>Durasi: <strong>{p.durationEstimate}</strong></span>
                      <span>Model: <strong>{p.workSetup}</strong></span>
                      {p.submissionDeadline && <span>Deadline: {p.submissionDeadline}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPending ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleApprove(p.id || '')}
                          disabled={reviewProjectMutation.isPending}
                          className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Setujui Tayang</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(p.id || '')}
                          className="rounded-xl text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          Tolak
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedProjectId(selectedProjectId === p.id ? null : p.id || null)}
                        className="rounded-xl text-xs font-bold gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{selectedProjectId === p.id ? 'Tutup Pelamar' : 'Lihat Pelamar'}</span>
                      </Button>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(p.id || '')}
                      className="rounded-xl text-rose-600 hover:bg-rose-50 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Sub-panel pelamar jika diklik */}
                {selectedProjectId === p.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 rounded-2xl p-4 space-y-2">
                    <h5 className="text-xs font-black text-slate-800">
                      Pelamar Alumni ({applicants.length}):
                    </h5>
                    {applicants.length === 0 ? (
                      <p className="text-[11px] text-slate-400">Belum ada pelamar alumni.</p>
                    ) : (
                      applicants.map((a) => (
                        <div key={a.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-3">
                          <div>
                            <span className="font-bold text-slate-900">{a.alumniName}</span>
                            <span className="text-slate-400 ml-2">({a.alumniProgram || 'Alumni STP'})</span>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{a.proposalLetter}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {a.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

