// src/app/(admin)/survei-ikm/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { AdminPageHeader } from '@/components/admin';
import { useAllIkmSurveys } from '@/hooks/useIkm';
import { ikmService } from '@/services/ikm.service';
import { IKM_SERVICE_LABELS, IkmServiceType, IkmSurvey } from '@/types/ikm.types';
import {
  Award,
  Users,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  BarChart2,
  Smile,
  ShieldCheck,
  Building2,
  Calendar,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const UNSUR_NAMES = [
  { key: 'u1', label: '1. Persyaratan Pelayanan' },
  { key: 'u2', label: '2. Prosedur Pelayanan' },
  { key: 'u3', label: '3. Waktu Pelayanan' },
  { key: 'u4', label: '4. Biaya / Tarif' },
  { key: 'u5', label: '5. Produk Spesifikasi' },
  { key: 'u6', label: '6. Kompetensi Petugas' },
  { key: 'u7', label: '7. Perilaku Petugas' },
  { key: 'u8', label: '8. Kualitas Sarana & Prasarana' },
  { key: 'u9', label: '9. Penanganan Aduan' },
];

export default function SurveiIkmAdminPage() {
  const { data: surveys = [], isLoading } = useAllIkmSurveys();
  const [selectedService, setSelectedService] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate Summary
  const summary = useMemo(() => {
    const filtered =
      selectedService === 'ALL'
        ? surveys
        : surveys.filter((s) => s.serviceType === selectedService);
    return ikmService.calculateSummaryStats(filtered);
  }, [surveys, selectedService]);

  // Filtered Survey List
  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      const matchService = selectedService === 'ALL' || s.serviceType === selectedService;
      const matchSearch =
        s.respondentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.feedback && s.feedback.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchService && matchSearch;
    });
  }, [surveys, selectedService, searchTerm]);

  return (
    <div className="space-y-6 pb-20">
      <AdminPageHeader
        title="Indeks Kepuasan Masyarakat (IKM)"
        description="Hasil evaluasi kepuasan publik berdasarkan PermenPAN-RB No. 14 Tahun 2017 untuk seluruh layanan teknopark."
      />

      {/* SUMMARY BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-100 uppercase tracking-wider">Nilai IKM Konversi</p>
              <h2 className="text-4xl font-black mt-1">{summary.overallConvertedScore}</h2>
              <p className="text-xs text-blue-100 mt-1">Skala 25.00 - 100.00</p>
            </div>
            <div className="text-center bg-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-sm border border-white/20">
              <span className="text-3xl font-black">{summary.overallGrade}</span>
              <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                {summary.overallGrade === 'A'
                  ? 'Sangat Baik'
                  : summary.overallGrade === 'B'
                  ? 'Baik'
                  : summary.overallGrade === 'C'
                  ? 'Kurang Baik'
                  : 'Buruk'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Responden</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{summary.totalRespondents} Orang</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Award size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mutu Pelayanan</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                {summary.overallConvertedScore >= 88.31
                  ? 'Sangat Memuaskan'
                  : summary.overallConvertedScore >= 76.61
                  ? 'Memuaskan'
                  : 'Perlu Peningkatan'}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Smile size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata 9 Unsur</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                {(summary.overallConvertedScore / 25).toFixed(2)} / 4.00
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 9 UNSUR REKAPITULASI GRID */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart2 size={18} className="text-blue-600" />
          Rekapitulasi 9 Unsur Pelayanan (PermenPAN-RB No. 14/2017)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {UNSUR_NAMES.map((u) => {
            const score = (summary.unsurAverages as any)[u.key] || 0;
            const percentage = (score / 4) * 100;
            return (
              <div key={u.key} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700">{u.label}</span>
                  <span className="font-mono font-black text-blue-600">{score.toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER & TABLE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <Input
              placeholder="Cari nama responden atau ulasan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700"
          >
            <option value="ALL">Semua Jenis Layanan</option>
            {Object.entries(IKM_SERVICE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-3 px-4">Responden</th>
                  <th className="py-3 px-4">Layanan Dinilai</th>
                  <th className="py-3 px-4">Skor Rata-rata</th>
                  <th className="py-3 px-4">Nilai Konversi</th>
                  <th className="py-3 px-4">Mutu</th>
                  <th className="py-3 px-4">Ulasan & Masukan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSurveys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Belum ada data survei kepuasan yang tercatat.
                    </td>
                  </tr>
                ) : (
                  filteredSurveys.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{item.respondentName}</p>
                        <p className="text-xs text-slate-400">{item.respondentAgency || 'Masyarakat Umum'}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="font-medium text-xs">
                          {IKM_SERVICE_LABELS[item.serviceType] || item.serviceType}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {item.averageScore.toFixed(2)} / 4.00
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {item.convertedScore.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          className={
                            item.grade === 'A'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : item.grade === 'B'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }
                        >
                          Predikat {item.grade}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-sm">
                        {item.feedback ? (
                          <p className="italic line-clamp-2">"{item.feedback}"</p>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

