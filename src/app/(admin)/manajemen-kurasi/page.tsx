// Lokasi file: src/app/(admin)/manajemen-kurasi/page.tsx
// Pusat Kurasi & Asesmen AI Terpadu (Universal AI Curation & Assessment Center)

'use client';

import React, { Suspense } from 'react';
import { useAdminTab } from '@/hooks/useAdminTab';
import { AdminPageHeader, AdminStatGrid } from '@/components/admin';
import { useCurationAssessments, useCurationTemplates, useCurationTokens } from '@/hooks/useCurationSystem';
import {
  ShieldCheck,
  Sparkles,
  Layers,
  ShoppingBag,
  Key,
  Award,
  CheckCircle2,
  Clock,
  GraduationCap,
} from 'lucide-react';
import TabCurationQueue from './components/TabCurationQueue';
import TabTemplateBuilder from './components/TabTemplateBuilder';
import TabProductQuickCuration from './components/TabProductQuickCuration';
import TabBatchTokens from './components/TabBatchTokens';

const CURATION_TABS = ['antrean', 'template', 'produk', 'token'] as const;
type CurationTab = (typeof CURATION_TABS)[number];

function ManajemenKurasiContent() {
  const [activeTab, setActiveTab] = useAdminTab<CurationTab>('antrean', CURATION_TABS);

  const { data: assessments = [] } = useCurationAssessments();
  const { data: templates = [] } = useCurationTemplates();
  const { data: tokens = [] } = useCurationTokens();

  const totalWaiting = assessments.filter((a) => a.status === 'COMPLETED' || a.status === 'Curator_Draft').length;
  const totalValidated = assessments.filter((a) => a.status === 'Curator_Validated').length;

  return (
    <div className="space-y-6 pb-20">
      
      {/* PAGE HEADER */}
      <AdminPageHeader
        title="Pusat Kurasi & Asesmen AI"
        description="Sistem evaluasi cerdas multi-domain: Kurasi Produk E-Katalog, Asesmen Kompetensi Alumni Pelatihan, Skrining Tenant, dan Inovasi Krenova."
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Clario Multi-Agent Engine
          </span>
        }
      />

      {/* STATISTIK RINGKAS */}
      <AdminStatGrid
        columns={4}
        items={[
          {
            label: 'Menunggu Validasi Kurator',
            value: totalWaiting,
            subtext: 'Memerlukan kalibrasi lapangan',
            icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />,
            color: 'amber',
          },
          {
            label: 'Total Tervalidasi Final',
            value: totalValidated,
            subtext: 'Terkurasi & terkunci resmi',
            icon: <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />,
            color: 'emerald',
          },
          {
            label: 'Instrumen Asesmen Aktif',
            value: templates.length,
            subtext: 'Template kuesioner dinamis',
            icon: <Layers className="w-4 h-4 sm:w-5 sm:h-5" />,
            color: 'blue',
          },
          {
            label: 'Token Batch Terdistribusi',
            value: tokens.length,
            subtext: 'Akses kelas & program',
            icon: <Key className="w-4 h-4 sm:w-5 sm:h-5" />,
            color: 'purple',
          },
        ]}
      />

      {/* TAB NAVIGATION BAR */}
      <div className="flex border-b border-slate-200 overflow-x-auto custom-scrollbar gap-2">
        <button
          onClick={() => setActiveTab('antrean')}
          className={`pb-3 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'antrean'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={16} /> Antrean & Workbench Kurator ({assessments.length})
        </button>
        <button
          onClick={() => setActiveTab('template')}
          className={`pb-3 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'template'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers size={16} /> Studio Template & AI Builder ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('produk')}
          className={`pb-3 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'produk'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag size={16} /> Kurasi Produk & E-Katalog
        </button>
        <button
          onClick={() => setActiveTab('token')}
          className={`pb-3 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'token'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Key size={16} /> Distribusi Token Batch ({tokens.length})
        </button>
      </div>

      {/* TAB CONTENTS */}
      <div>
        {activeTab === 'antrean' && <TabCurationQueue />}
        {activeTab === 'template' && <TabTemplateBuilder />}
        {activeTab === 'produk' && <TabProductQuickCuration />}
        {activeTab === 'token' && <TabBatchTokens />}
      </div>

    </div>
  );
}

export default function ManajemenKurasiPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 font-bold text-sm">
          Menyiapkan Pusat Kurasi AI...
        </div>
      }
    >
      <ManajemenKurasiContent />
    </Suspense>
  );
}

