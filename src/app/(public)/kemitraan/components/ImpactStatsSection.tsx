// src/app/(public)/kemitraan/components/ImpactStatsSection.tsx
'use client';

import React from 'react';
import {
  TrendingUp,
  Building2,
  Users,
  Award,
  Layers,
  Banknote,
  CheckCircle2,
} from 'lucide-react';

const STATS = [
  {
    icon: Building2,
    value: '58+',
    label: 'Mitra Industri & Korporasi',
    sub: 'Termasuk BUMN, Perbankan & Global Tech Principal',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  },
  {
    icon: Banknote,
    value: 'Rp 6,4 M+',
    label: 'Penyaluran Pembiayaan & Beasiswa',
    sub: 'Fasilitas kredit pendidikan & subsidi CSR industri',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    icon: Users,
    value: '93.8%',
    label: 'Tingkat Keterserapan Lulusan',
    sub: 'Terserap kerja < 3 bulan pasca uji sertifikasi kompetensi',
    color: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  {
    icon: Layers,
    value: '84+',
    label: 'Proyek Rekayasa Industri Selesai',
    sub: 'Diselesaikan via Open Project Marketplace & Lab Manufaktur',
    color: 'text-amber-600 bg-amber-50 border-amber-100',
  },
];

export default function ImpactStatsSection() {
  return (
    <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-lg">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-black tracking-widest text-indigo-400 uppercase block mb-1">
            Indikator Kinerja & Dampak Kerjasama
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Kolaborasi Berkelanjutan yang Menghasilkan Dampak Nyata
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-md">
          Pengelolaan ekosistem terpadu memastikan setiap rupiah investasi dan kesepakatan kerjasama berdampak langsung pada daya saing ekonomi daerah.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-2 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl md:text-3xl font-black text-white">{stat.value}</span>
                <span className={`p-2 rounded-xl border ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-200">{stat.label}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">{stat.sub}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

