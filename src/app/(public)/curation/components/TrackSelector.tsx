// Lokasi file: src/app/(public)/curation/components/TrackSelector.tsx
// Pemilihan Jalur Instrumen Asesmen Dinamis (Multi-Domain)

'use client';

import React, { useState } from 'react';
import {
  CurationTemplate,
  CurationDomain,
  CURATION_DOMAIN_LABELS,
} from '@/types/curation.types';
import { useCurationTemplates } from '@/hooks/useCurationSystem';
import {
  ShoppingBag,
  GraduationCap,
  Building,
  Award,
  ArrowRight,
  ChevronLeft,
  Check,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onSelect: (template: CurationTemplate) => void;
  onBack: () => void;
  initialDomain?: CurationDomain;
}

export default function TrackSelector({ onSelect, onBack, initialDomain }: Props) {
  const [selectedDomain, setSelectedDomain] = useState<CurationDomain | 'ALL'>(initialDomain || 'ALL');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useCurationTemplates(
    selectedDomain === 'ALL' ? undefined : selectedDomain
  );

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || null;

  const getDomainIcon = (domain: CurationDomain) => {
    switch (domain) {
      case 'PRODUCT_CURATION':
        return ShoppingBag;
      case 'ALUMNI_ASSESSMENT':
        return GraduationCap;
      case 'TENANT_INCUBATION':
        return Building;
      default:
        return Award;
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-5.5rem)] flex flex-col items-center justify-center bg-slate-50 px-6 lg:px-16 py-12 relative">
      <div className="w-full max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
        
        {/* Tombol Kembali */}
        <button
          onClick={onBack}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 bg-white px-4 py-2 rounded-full shadow-xs border border-slate-200 w-fit cursor-pointer transition-colors"
        >
          <ChevronLeft size={16} /> Kembali ke Beranda
        </button>

        {/* Title & Filter Tabs */}
        <div className="space-y-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Langkah 1: Tentukan Instrumen Asesmen
          </span>
          <h2 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Pilih Kategori Program &amp; Instrumen
          </h2>
          <p className="text-slate-500 text-sm lg:text-base max-w-2xl leading-relaxed">
            Pilih instrumen yang sesuai dengan profil Anda agar mesin AI kami dapat mengkalibrasi indikator metrik, rubrik penilaian, dan pertanyaan interogasi secara objektif.
          </p>

          {/* Filter Domain Selector */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              variant={selectedDomain === 'ALL' ? 'default' : 'outline'}
              onClick={() => setSelectedDomain('ALL')}
              className="text-xs font-bold rounded-xl h-9"
            >
              Semua Program ({templates.length})
            </Button>
            {(['PRODUCT_CURATION', 'ALUMNI_ASSESSMENT', 'TENANT_INCUBATION', 'CUSTOM_INNOVATION'] as CurationDomain[]).map(
              (domain) => {
                const Icon = getDomainIcon(domain);
                return (
                  <Button
                    key={domain}
                    size="sm"
                    variant={selectedDomain === domain ? 'default' : 'outline'}
                    onClick={() => setSelectedDomain(domain)}
                    className="text-xs font-bold rounded-xl h-9 gap-1.5"
                  >
                    <Icon size={14} />
                    {CURATION_DOMAIN_LABELS[domain]}
                  </Button>
                );
              }
            )}
          </div>
        </div>

        {/* BENTO GRID TEMPLATE CARDS */}
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 font-bold bg-white rounded-3xl border border-slate-200">
            Memuat instrumen asesmen...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl) => {
              const Icon = getDomainIcon(tpl.curationDomain);
              const isSelected = selectedTemplateId === tpl.id;

              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`relative overflow-hidden cursor-pointer rounded-3xl p-7 transition-all duration-300 flex flex-col justify-between border-2 min-h-[280px] group ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 scale-[1.02]'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:shadow-xl'
                  }`}
                >
                  {/* Background Watermark Icon */}
                  <Icon
                    size={160}
                    className={`absolute -bottom-8 -right-8 transition-opacity duration-300 ${
                      isSelected ? 'opacity-10 text-white' : 'opacity-5 text-slate-900 group-hover:opacity-10'
                    }`}
                  />

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-indigo-50 text-indigo-600'
                        }`}
                      >
                        <Icon size={24} />
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-white bg-white text-indigo-600' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check size={14} className="stroke-[3]" />}
                      </div>
                    </div>

                    <div>
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                        }`}
                      >
                        {CURATION_DOMAIN_LABELS[tpl.curationDomain]}
                      </span>
                      <h3 className={`font-black text-xl tracking-tight mt-1.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {tpl.trackName}
                      </h3>
                      <p className={`text-xs font-medium leading-relaxed mt-2 line-clamp-3 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {tpl.trackDescription}
                      </p>
                    </div>
                  </div>

                  <div className={`relative z-10 pt-4 border-t text-[11px] font-bold flex justify-between items-center ${
                    isSelected ? 'border-white/20 text-indigo-100' : 'border-slate-100 text-slate-400'
                  }`}>
                    <span>{tpl.steps?.length || 0} Seksi Pertanyaan</span>
                    <span className="flex items-center gap-1 font-extrabold">
                      {tpl.aiPromptConfig?.expectedMetrics?.length || 0} Metrik Radar
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BOTTOM ACTION */}
        <div className="flex justify-end pt-4">
          <Button
            size="lg"
            disabled={!selectedTemplate}
            onClick={() => selectedTemplate && onSelect(selectedTemplate)}
            className="w-full sm:w-auto px-10 py-6 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-2xl text-base shadow-xl gap-2 disabled:opacity-40 cursor-pointer transition-all"
          >
            Lanjutkan ke Kuesioner Asesmen <ArrowRight size={18} />
          </Button>
        </div>

      </div>
    </div>
  );
}
