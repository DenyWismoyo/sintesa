// Lokasi file: src/app/(admin)/manajemen-karir/components/TabTracerStudyAnalytics.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Briefcase,
  Building2,
  TrendingUp,
  Download,
  RotateCw,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Award,
  Users,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { alumniService } from '@/services/alumni.service';
import { exportAlumniTracerStudy } from '@/services/careerExport.service';
import { Alumni } from '@/types';
import { toast } from 'sonner';

export default function TabTracerStudyAnalytics() {
  const [alumnis, setAlumnis] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'STP' | 'RSKB'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HIRED' | 'SEEKING'>('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await alumniService.getAllAlumnis();
      setAlumnis(data);
    } catch (err) {
      toast.error('Gagal memuat data Tracer Study alumni.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = alumnis.length;
    const stpAlumni = alumnis.filter((a) => a.originSource !== 'RSKB_SURAKARTA');
    const rskbAlumni = alumnis.filter((a) => a.originSource === 'RSKB_SURAKARTA');

    const isHired = (a: Alumni) => {
      const s = (a.employmentStatus || '').toLowerCase();
      return (
        s.includes('bekerja') ||
        s.includes('wirausaha') ||
        s.includes('freelance') ||
        a.internalStatus === 'HIRED'
      );
    };

    const stpHired = stpAlumni.filter(isHired).length;
    const rskbHired = rskbAlumni.filter(isHired).length;
    const totalHired = stpHired + rskbHired;

    const stpRate = stpAlumni.length > 0 ? Math.round((stpHired / stpAlumni.length) * 100) : 0;
    const rskbRate = rskbAlumni.length > 0 ? Math.round((rskbHired / rskbAlumni.length) * 100) : 0;
    const totalRate = total > 0 ? Math.round((totalHired / total) * 100) : 0;

    return {
      total,
      stpCount: stpAlumni.length,
      rskbCount: rskbAlumni.length,
      stpHired,
      rskbHired,
      totalHired,
      stpRate,
      rskbRate,
      totalRate,
    };
  }, [alumnis]);

  const filteredAlumnis = useMemo(() => {
    return alumnis.filter((a) => {
      const matchSearch =
        !search.trim() ||
        (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.programTaken || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.company || '').toLowerCase().includes(search.toLowerCase());

      const matchSource =
        sourceFilter === 'ALL'
          ? true
          : sourceFilter === 'RSKB'
          ? a.originSource === 'RSKB_SURAKARTA'
          : a.originSource !== 'RSKB_SURAKARTA';

      const s = (a.employmentStatus || '').toLowerCase();
      const hired = s.includes('bekerja') || s.includes('wirausaha') || s.includes('freelance') || a.internalStatus === 'HIRED';

      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'HIRED'
          ? hired
          : !hired;

      return matchSearch && matchSource && matchStatus;
    });
  }, [alumnis, search, sourceFilter, statusFilter]);

  const handleExport = (format: 'XLSX' | 'CSV') => {
    if (filteredAlumnis.length === 0) {
      toast.error('Tidak ada data untuk diekspor.');
      return;
    }
    exportAlumniTracerStudy(filteredAlumnis, format);
    toast.success(`Laporan Tracer Study berhasil diekspor (${format})!`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Analitik Serapan Kerja Real-Time</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Tracer Study Alumni STP Vokasi × RSKB Surakarta
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed mt-0.5">
              Pantau persentase lulusan pelatihan yang berhasil terserap di dunia industri, magang, dan wirausaha mandiri secara terpadu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={loadData}
              className="h-10 px-3.5 rounded-xl text-xs font-bold gap-1.5 border-slate-200"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleExport('XLSX')}
              className="h-10 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleExport('CSV')}
              className="h-10 px-3.5 rounded-xl text-xs font-bold border-slate-200 gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </Button>
          </div>
        </div>

        {/* 2. Metric Cards Serapan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Serapan Kawasan */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Serapan Gabungan
              </span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                {stats.totalRate}% Terserap
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-black text-slate-900">{stats.totalHired}</h4>
              <span className="text-xs text-slate-500 font-semibold">dari {stats.total} Alumni</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.totalRate}%` }}
              />
            </div>
          </div>

          {/* Card 2: Serapan STP Vokasi */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Akademi Vokasi STP
              </span>
              <span className="text-xs font-black text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                {stats.stpRate}% Terserap
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-black text-slate-900">{stats.stpHired}</h4>
              <span className="text-xs text-slate-500 font-semibold">dari {stats.stpCount} Lulusan</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.stpRate}%` }}
              />
            </div>
          </div>

          {/* Card 3: Serapan RSKB Surakarta */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                RSKB Kota Surakarta
              </span>
              <span className="text-xs font-black text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-full">
                {stats.rskbRate}% Terserap
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-black text-slate-900">{stats.rskbHired}</h4>
              <span className="text-xs text-slate-500 font-semibold">dari {stats.rskbCount} Peserta</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.rskbRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & List Data */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama alumni, program, atau perusahaan..."
              className="pl-10 h-10 rounded-xl text-xs bg-slate-50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700"
            >
              <option value="ALL">Semua Jalur</option>
              <option value="STP">STP Vokasi</option>
              <option value="RSKB">RSKB Surakarta</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700"
            >
              <option value="ALL">Semua Status Karir</option>
              <option value="HIRED">Terserap Bekerja / Usaha</option>
              <option value="SEEKING">Mencari Kerja / Verifikasi</option>
            </select>
          </div>
        </div>

        {/* Tabel Mini Data Tracer Study */}
        {loading ? (
          <p className="text-xs text-slate-400 py-10 text-center">Memuat data Tracer Study...</p>
        ) : filteredAlumnis.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-bold">Tidak ada alumni yang sesuai filter pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Nama Alumni</th>
                  <th className="py-2.5 px-3">Asal Program</th>
                  <th className="py-2.5 px-3">Kejuruan</th>
                  <th className="py-2.5 px-3">Status Karir</th>
                  <th className="py-2.5 px-3">Perusahaan & Jabatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAlumnis.slice(0, 15).map((a) => {
                  const isRskb = a.originSource === 'RSKB_SURAKARTA';
                  const s = (a.employmentStatus || '').toLowerCase();
                  const isHired = s.includes('bekerja') || s.includes('wirausaha') || a.internalStatus === 'HIRED';

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">{a.name}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isRskb
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isRskb ? 'RSKB Surakarta' : 'STP Vokasi'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{a.programTaken || '-'}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isHired
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {a.employmentStatus || 'Proses Verifikasi'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {a.company || a.hiredByCompany ? (
                          <span>
                            {a.company || a.hiredByCompany}
                            {a.currentJob ? ` — ${a.currentJob}` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredAlumnis.length > 15 && (
              <p className="text-[11px] text-slate-400 text-center pt-3">
                Menampilkan 15 dari {filteredAlumnis.length} alumni. Gunakan tombol <strong>Ekspor Excel</strong> untuk mengunduh seluruh baris data.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

