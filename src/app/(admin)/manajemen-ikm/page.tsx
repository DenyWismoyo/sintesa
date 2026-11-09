// src/app/(admin)/manajemen-ikm/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { AdminPageHeader, AdminResponsiveView, AdminStatGrid, AdminFilterBar } from '@/components/admin';
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
  Printer,
} from 'lucide-react';
import ModalPrintIkmReport from './components/ModalPrintIkmReport';
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
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

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
    <div className="space-y-5 pb-20">
      <AdminPageHeader
        title="Indeks Kepuasan Masyarakat (IKM)"
        description="Hasil evaluasi kepuasan publik berdasarkan PermenPAN-RB No. 14 Tahun 2017 untuk seluruh layanan teknopark."
        actions={
          <Button
            onClick={() => setIsPrintModalOpen(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs gap-1.5 h-8.5 px-3.5 shadow-xs shrink-0"
          >
            <Printer size={14} /> Cetak Laporan Resmi PermenPAN-RB
          </Button>
        }
      />

      {/* SUMMARY BANNER */}
      <AdminStatGrid
        columns={4}
        items={[
          {
            label: 'Nilai IKM (Skala 25-100)',
            value: `${summary.overallConvertedScore} (Mutu ${summary.overallGrade})`,
            subtext:
              summary.overallGrade === 'A'
                ? 'Predikat Sangat Baik'
                : summary.overallGrade === 'B'
                ? 'Predikat Baik'
                : summary.overallGrade === 'C'
                ? 'Predikat Kurang'
                : 'Predikat Buruk',
            icon: <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />,
            color: 'blue',
          },
          {
            label: 'Total Responden',
            value: summary.totalRespondents,
            subtext: 'Kuesioner masuk terverifikasi',
            icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
            color: 'emerald',
          },
          {
            label: 'Mutu Layanan',
            value:
              summary.overallConvertedScore >= 88.31
                ? 'Sangat Memuaskan'
                : summary.overallConvertedScore >= 76.61
                ? 'Memuaskan'
                : 'Perlu Peningkatan',
            subtext: 'Standar PermenPAN-RB 14/2017',
            icon: <Award className="w-4 h-4 sm:w-5 sm:h-5" />,
            color: 'purple',
          },
          {
            label: 'Rata-rata Unsur',
            value: `${(summary.overallConvertedScore / 25).toFixed(2)} / 4.00`,
            subtext: 'Agregat 9 unsur pelayanan',
            icon: <Smile className="w-4 h-4 sm:w-5 sm:h-5" />,
            color: 'amber',
          },
        ]}
      />

      {/* 9 UNSUR REKAPITULASI GRID */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3.5 flex items-center gap-2">
          <BarChart2 size={16} className="text-blue-600" />
          Rekapitulasi 9 Unsur Pelayanan (PermenPAN-RB No. 14/2017)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {UNSUR_NAMES.map((u) => {
            const score = (summary.unsurAverages as any)[u.key] || 0;
            const percentage = (score / 4) * 100;
            return (
              <div key={u.key} className="p-2.5 sm:p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 text-[11px] sm:text-xs truncate">{u.label}</span>
                  <span className="font-mono font-bold text-blue-600 text-xs shrink-0">{score.toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
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
      <div className="space-y-3.5">
        <AdminFilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Cari nama responden atau ulasan masukan..."
          filters={[
            {
              id: 'serviceType',
              value: selectedService,
              onChange: setSelectedService,
              options: [
                { label: 'Semua Jenis Layanan', value: 'ALL' },
                ...Object.entries(IKM_SERVICE_LABELS).map(([key, label]) => ({
                  label,
                  value: key,
                })),
              ],
            },
          ]}
          hasActiveFilters={Boolean(searchTerm || selectedService !== 'ALL')}
          onReset={() => {
            setSearchTerm('');
            setSelectedService('ALL');
          }}
        />

        <AdminResponsiveView<IkmSurvey>
          items={filteredSurveys}
          isLoading={isLoading}
          emptyTitle="Tidak Ada Data Survei IKM"
          emptyMessage="Belum ada ulasan atau kuesioner survei kepuasan yang sesuai filter."
          renderDesktopTable={(items) => (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs">
                <tr>
                  <th className="py-3 px-4">Responden</th>
                  <th className="py-3 px-4">Layanan Dinilai</th>
                  <th className="py-3 px-4">Skor Rata-rata</th>
                  <th className="py-3 px-4">Nilai Konversi</th>
                  <th className="py-3 px-4">Mutu</th>
                  <th className="py-3 px-4">Ulasan & Masukan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800 text-xs sm:text-sm">{item.respondentName}</p>
                      <p className="text-[11px] text-slate-400">{item.respondentAgency || 'Masyarakat Umum'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="font-medium text-[10px] px-1.5 py-0.5">
                        {IKM_SERVICE_LABELS[item.serviceType] || item.serviceType}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 text-xs">
                      {item.averageScore.toFixed(2)} / 4.00
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 text-xs">
                      {item.convertedScore.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={`text-[10px] font-bold px-2 py-0.5 ${
                          item.grade === 'A'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.grade === 'B'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        Predikat {item.grade}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-sm">
                      {item.feedback ? (
                        <p className="italic line-clamp-2 text-[11px] text-slate-600">"{item.feedback}"</p>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          renderMobileCard={(item) => (
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{item.respondentName}</h4>
                  <p className="text-[11px] text-slate-500">{item.respondentAgency || 'Masyarakat Umum'}</p>
                </div>
                <Badge
                  className={`text-[9px] font-bold px-1.5 py-0.5 shrink-0 ${
                    item.grade === 'A'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : item.grade === 'B'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  Predikat {item.grade}
                </Badge>
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Layanan:</span>
                  <span className="font-semibold text-slate-800">{IKM_SERVICE_LABELS[item.serviceType] || item.serviceType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Skor Rata-rata:</span>
                  <span className="font-mono font-bold text-slate-700">{item.averageScore.toFixed(2)} / 4.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Nilai Konversi:</span>
                  <span className="font-mono font-bold text-blue-600">{item.convertedScore.toFixed(2)}</span>
                </div>
                {item.feedback && (
                  <div className="pt-1 text-slate-600 italic border-t border-slate-100 mt-1">
                    "{item.feedback}"
                  </div>
                )}
              </div>
            </div>
          )}
        />
      </div>

      {/* MODAL PRINT LAPORAN RESMI IKM */}
      <ModalPrintIkmReport
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        stats={{
          totalRespondents: summary.totalRespondents,
          overallAverageScore: summary.overallConvertedScore / 25,
          convertedScore: summary.overallConvertedScore,
          grade: summary.overallGrade,
          gradeLabel:
            summary.overallGrade === 'A'
              ? 'Sangat Baik'
              : summary.overallGrade === 'B'
              ? 'Baik'
              : summary.overallGrade === 'C'
              ? 'Kurang Baik'
              : 'Buruk',
          averageScores: {
            u1_persyaratan: summary.unsurAverages.u1,
            u2_prosedur: summary.unsurAverages.u2,
            u3_waktu: summary.unsurAverages.u3,
            u4_biaya: summary.unsurAverages.u4,
            u5_produk: summary.unsurAverages.u5,
            u6_kompetensi: summary.unsurAverages.u6,
            u7_perilaku: summary.unsurAverages.u7,
            u8_sarana: summary.unsurAverages.u8,
            u9_pengaduan: summary.unsurAverages.u9,
          },
        }}
      />
    </div>
  );
}

