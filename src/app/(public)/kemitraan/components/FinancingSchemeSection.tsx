// src/app/(public)/kemitraan/components/FinancingSchemeSection.tsx
'use client';

import React, { useState } from 'react';
import {
  Landmark,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Percent,
  Clock,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/utils/format';
import { FinancingScheme, FINANCING_SCHEME_LABELS } from '@/types/partnership.types';
import SimulasiPembiayaanModal from './SimulasiPembiayaanModal';

interface FinancingSchemeSectionProps {
  schemes: FinancingScheme[];
}

export default function FinancingSchemeSection({ schemes }: FinancingSchemeSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<FinancingScheme | null>(null);

  const handleOpenSimulasi = (scheme?: FinancingScheme) => {
    setSelectedScheme(scheme || null);
    setIsModalOpen(true);
  };

  return (
    <div id="pembiayaan-pelatihan" className="space-y-6 pt-4">
      {/* Banner Pengantar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-bold backdrop-blur-md">
              <Landmark className="w-3.5 h-3.5" />
              <span>Ekosistem Pembiayaan Pendidikan & Pelatihan Vokasi</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              Akses Pelatihan Tanpa Beban Finansial dengan Skema Perbankan & CSR
            </h2>
            <p className="text-xs md:text-sm text-indigo-200/90 leading-relaxed">
              Solo Technopark menggandeng Bank Jateng, Bank Syariah Indonesia (BSI), yayasan korporasi terkemuka, dan RSKB Surakarta untuk menyediakan pembiayaan kursus terjangkau: dari KUR Lunak, Cicilan 0% Syariah, hingga Beasiswa Penuh Ikatan Kerja.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button
              type="button"
              onClick={() => handleOpenSimulasi()}
              className="h-12 px-6 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs gap-2.5 shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>Buka Kalkulator Angsuran</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Kartu Skema Pembiayaan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {schemes.map((scheme) => {
          const quotaPercent = Math.min(
            100,
            Math.round(((scheme.quotaUsed || 0) / (scheme.quotaTotal || 1)) * 100)
          );

          return (
            <div
              key={scheme.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-5 flex flex-col justify-between hover:shadow-lg hover:border-indigo-200 transition-all group"
            >
              <div className="space-y-3">
                {/* Header Partner */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-indigo-700 truncate">
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

                <div>
                  <h3 className="font-black text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {scheme.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1 line-clamp-2">
                    {scheme.description}
                  </p>
                </div>

                {/* Fitur Utama */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Percent className="w-3.5 h-3.5 text-indigo-500" /> Plafon Maks
                    </span>
                    <strong className="text-slate-900">{formatRupiah(scheme.maxAmount)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" /> Tenor
                    </span>
                    <strong className="text-slate-900">{scheme.tenorMonths ? `${scheme.tenorMonths} Bulan` : 'Sesuai Batch'}</strong>
                  </div>
                </div>

                {/* Progress Kuota */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-500">Kuota Tersisa</span>
                    <span className="text-indigo-700">
                      {(scheme.quotaTotal || 0) - (scheme.quotaUsed || 0)} / {scheme.quotaTotal} Kursi
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${quotaPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenSimulasi(scheme)}
                  className="w-full h-9 rounded-xl text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 gap-1.5 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-transparent transition-all"
                >
                  <span>Simulasi & Ajukan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <SimulasiPembiayaanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedScheme={selectedScheme}
        schemes={schemes}
      />
    </div>
  );
}

