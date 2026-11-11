// Lokasi file: src/app/(admin)/manajemen-kurasi/components/TabCurationQueue.tsx
// Antrean & Manajemen Verifikasi Kurasi

'use client';

import React, { useState } from 'react';
import {
  CurationAssessment,
  CurationDomain,
  CURATION_DOMAIN_LABELS,
} from '@/types/curation.types';
import { useCurationAssessments } from '@/hooks/useCurationSystem';
import {
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Eye,
  ShoppingBag,
  GraduationCap,
  Building,
  Award,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ModalCuratorWorkbench from './ModalCuratorWorkbench';

export default function TabCurationQueue() {
  const [selectedDomain, setSelectedDomain] = useState<CurationDomain | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAssessment, setActiveAssessment] = useState<CurationAssessment | null>(null);

  const { data: assessments = [], isLoading } = useCurationAssessments(
    selectedDomain === 'ALL' ? undefined : selectedDomain,
    selectedStatus
  );

  const filtered = assessments.filter((a) => {
    const term = searchTerm.toLowerCase();
    const matchName = a.subjekName.toLowerCase().includes(term);
    const matchTrack = a.trackType.toLowerCase().includes(term);
    return matchName || matchTrack;
  });

  const getDomainIcon = (domain: CurationDomain) => {
    switch (domain) {
      case 'PRODUCT_CURATION':
        return <ShoppingBag size={14} className="text-emerald-600" />;
      case 'ALUMNI_ASSESSMENT':
        return <GraduationCap size={14} className="text-blue-600" />;
      case 'TENANT_INCUBATION':
        return <Building size={14} className="text-purple-600" />;
      default:
        return <Award size={14} className="text-amber-600" />;
    }
  };

  const getStatusBadge = (status: string = 'PENDING') => {
    switch (status) {
      case 'Curator_Validated':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Final Tervalidasi</Badge>;
      case 'Curator_Draft':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Draf Kurator</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Menunggu Review</Badge>;
      default:
        return <Badge variant="outline">Diproses</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* FILTER & PENCARIAN */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Domain Filter Pills */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <Button
            size="sm"
            variant={selectedDomain === 'ALL' ? 'default' : 'outline'}
            onClick={() => setSelectedDomain('ALL')}
            className="text-xs h-8 rounded-xl font-bold"
          >
            Semua Domain
          </Button>
          {(['PRODUCT_CURATION', 'ALUMNI_ASSESSMENT', 'TENANT_INCUBATION', 'CUSTOM_INNOVATION'] as CurationDomain[]).map(
            (d) => (
              <Button
                key={d}
                size="sm"
                variant={selectedDomain === d ? 'default' : 'outline'}
                onClick={() => setSelectedDomain(d)}
                className="text-xs h-8 rounded-xl font-bold gap-1.5"
              >
                {getDomainIcon(d)}
                {CURATION_DOMAIN_LABELS[d]}
              </Button>
            )
          )}
        </div>

        {/* Search & Status Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="COMPLETED">Menunggu Review</option>
            <option value="Curator_Draft">Draf Kurator</option>
            <option value="Curator_Validated">Tervalidasi Final</option>
          </select>
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari subjek / program..."
              className="h-8.5 pl-8 text-xs bg-slate-50 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* DAFTAR ANTREAN */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm font-bold bg-white rounded-2xl border border-slate-200">
          Memuat antrean kurasi...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 space-y-2">
          <ShieldCheck size={36} className="mx-auto text-slate-300" />
          <p className="font-bold text-slate-700">Belum ada pengajuan kurasi di domain ini.</p>
          <p className="text-xs text-slate-400">Pengajuan dari portal publik atau kurasi produk akan muncul di sini.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Subjek & Domain</th>
                  <th className="py-3.5 px-4">Program / Track</th>
                  <th className="py-3.5 px-4 text-center">Skor AI</th>
                  <th className="py-3.5 px-4 text-center">Skor Terverifikasi</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((item) => {
                  const verified = item.curatorAssessment?.verifiedScore;
                  const aiScore = item.aiResult?.totalScore ?? item.score;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {getDomainIcon(item.curationDomain)}
                          {item.subjekName}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          {CURATION_DOMAIN_LABELS[item.curationDomain]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{item.trackType}</div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-md font-black bg-indigo-50 text-indigo-700 text-xs border border-indigo-100">
                          {aiScore}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {verified !== undefined ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-md font-black bg-emerald-50 text-emerald-700 text-xs border border-emerald-100">
                            {verified}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => setActiveAssessment(item)}
                          className="h-8 px-3 text-xs bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold gap-1.5 shadow-xs"
                        >
                          <Eye size={13} /> Workbench Kurator
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL WORKBENCH */}
      <ModalCuratorWorkbench
        isOpen={Boolean(activeAssessment)}
        onClose={() => setActiveAssessment(null)}
        assessment={activeAssessment}
      />

    </div>
  );
}

