// src/app/(public)/kemitraan/components/PartnerShowcase.tsx
'use client';

import React, { useState } from 'react';
import {
  Building2,
  Landmark,
  Cpu,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PartnerItem {
  name: string;
  category: 'BANK' | 'TECH' | 'MANUFACTURE' | 'BUMN';
  categoryLabel: string;
  scope: string;
  type: string;
}

const PARTNER_DIRECTORY: PartnerItem[] = [
  {
    name: 'Bank Jateng',
    category: 'BANK',
    categoryLabel: 'Perbankan & Pembiayaan',
    scope: 'Fasilitas Kredit Usaha Rakyat (KUR) Pendidikan Vokasi & Penyaluran Insentif Talenta',
    type: 'Mitra Finansial Resmi',
  },
  {
    name: 'Bank Syariah Indonesia (BSI)',
    category: 'BANK',
    categoryLabel: 'Perbankan & Pembiayaan',
    scope: 'Skema Cicilan 0% Syariah Pelatihan Digital & Cashless Smart Campus Ecosystem',
    type: 'Mitra Finansial Syariah',
  },
  {
    name: 'Shopee Solo Center',
    category: 'TECH',
    categoryLabel: 'Teknologi & Digital AI',
    scope: 'Pusat Inovasi & Kampus UMKM Ekspor Solo Technopark serta Rekrutmen IT Engineering',
    type: 'Tech Anchor Tenant',
  },
  {
    name: 'Huawei ICT Academy',
    category: 'TECH',
    categoryLabel: 'Teknologi & Digital AI',
    scope: 'Kurikulum Resmi 5G, AI & Cloud Computing serta Pusat Sertifikasi Internasional HCIA',
    type: 'Global Tech Principal',
  },
  {
    name: 'PT Astra International Tbk',
    category: 'MANUFACTURE',
    categoryLabel: 'Manufaktur Presisi',
    scope: 'Pemberian Beasiswa Penuh Ikatan Kerja & Pembinaan Lab CNC 5-Axis Presisi',
    type: 'Industrial CSR Partner',
  },
  {
    name: 'Schneider Electric Indonesia',
    category: 'MANUFACTURE',
    categoryLabel: 'Manufaktur Presisi',
    scope: 'Laboratorium Otomasi Industri & EcoStruxure Digital Energy Management Center',
    type: 'Industrial Lab Partner',
  },
  {
    name: 'AWS (Amazon Web Services)',
    category: 'TECH',
    categoryLabel: 'Teknologi & Digital AI',
    scope: 'Dukungan Cloud Credits Startup Inkubasi & Pelatihan AWS re/Start Cloud Practitioner',
    type: 'Global Cloud Partner',
  },
  {
    name: 'PT Telkom Indonesia (Persero) Tbk',
    category: 'BUMN',
    categoryLabel: 'BUMN & Korporasi',
    scope: 'Infrastruktur Konektivitas High-Speed Fiber, Cyber Security & Co-Working Indigo Hub',
    type: 'BUMN Strategis',
  },
  {
    name: 'PT Pindad (Persero)',
    category: 'BUMN',
    categoryLabel: 'BUMN & Korporasi',
    scope: 'Joint R&D Pengujian Mekanikal Komponen Presisi & Sertifikasi Ahli Las Industri',
    type: 'BUMN Pertahanan',
  },
  {
    name: 'PT Komatsu Indonesia',
    category: 'MANUFACTURE',
    categoryLabel: 'Manufaktur Presisi',
    scope: 'Penyerapan Lulusan Vokasi Mekatronika & Pengadaan Alat Uji Manufaktur Berat',
    type: 'Mitra Penyaluran Kerja',
  },
  {
    name: 'Gajah Tunggal Group',
    category: 'MANUFACTURE',
    categoryLabel: 'Manufaktur Presisi',
    scope: 'Program Magang Bersertifikat Industri & Penyelarasan Kurikulum Vokasi Karet & Polimer',
    type: 'Mitra Industri Manufaktur',
  },
  {
    name: 'Rumah Siap Kerja Bersama (RSKB)',
    category: 'BUMN',
    categoryLabel: 'BUMN & Korporasi',
    scope: 'Penyaluran Talenta Siap Kerja & Program Bantuan Pelatihan Tenaga Kerja Kota Surakarta',
    type: 'Pemerintah Kota Surakarta',
  },
];

export default function PartnerShowcase() {
  const [filter, setFilter] = useState<'ALL' | 'BANK' | 'TECH' | 'MANUFACTURE' | 'BUMN'>('ALL');

  const filtered = PARTNER_DIRECTORY.filter((item) => {
    if (filter === 'ALL') return true;
    return item.category === filter;
  });

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-bold mb-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Jejaring Kolaborator Resmi</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Dipercaya Oleh Pemimpin Industri, Perbankan & Lembaga Global
          </h2>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'Semua Mitra' },
            { id: 'BANK', label: 'Perbankan & Fintech' },
            { id: 'TECH', label: 'Teknologi & AI' },
            { id: 'MANUFACTURE', label: 'Manufaktur Presisi' },
            { id: 'BUMN', label: 'BUMN & Pemerintah' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filter === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((partner, index) => (
          <div
            key={index}
            className="p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold bg-slate-50 border-slate-200 text-slate-700"
                >
                  {partner.type}
                </Badge>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                  <ShieldCheck className="w-3 h-3" /> MoU Terdaftar
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900">{partner.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{partner.scope}</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Kluster Kerjasama</span>
              <span className="font-bold text-indigo-700">{partner.categoryLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

