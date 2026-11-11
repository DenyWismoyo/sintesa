// Lokasi file: src/app/(admin)/manajemen-kurasi/components/TabTemplateBuilder.tsx
// Katalog Instrumen Kurasi & Gerbang Studio Template Asesmen

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CurationTemplate,
  CurationDomain,
  CURATION_DOMAIN_LABELS,
} from '@/types/curation.types';
import { useCurationTemplates, useCurationMutations } from '@/hooks/useCurationSystem';
import {
  Plus,
  Sparkles,
  Trash2,
  Edit2,
  ShoppingBag,
  GraduationCap,
  Building,
  Award,
  Layers,
  CheckCircle2,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function TabTemplateBuilder() {
  const router = useRouter();
  const { data: templates = [], isLoading } = useCurationTemplates();
  const { saveTemplate, deleteTemplate } = useCurationMutations();

  // AI Architect Generator State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiForm, setAiForm] = useState({
    trackName: '',
    specificTargetContext: '',
    methodologyContext: '',
    instruction: '',
  });

  // Trigger AI Architect Generator
  const handleGenerateAiTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiForm.trackName.trim()) {
      toast.error('Nama Program Asesmen wajib diisi.');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/curation-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-template',
          ...aiForm,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.template) {
        throw new Error(data.error || 'Gagal menghasilkan template dari AI.');
      }

      const generated = data.template;
      const newTemplate: CurationTemplate = {
        id: `tpl-${Date.now()}`,
        trackName: aiForm.trackName,
        trackDescription: generated.aiPromptConfig?.assessmentGoal || 'Instrumen evaluasi dirancang oleh AI Architect.',
        trackIcon: 'Award',
        curationDomain: 'CUSTOM_INNOVATION',
        category: 'Kustom AI',
        isActive: true,
        version: 1,
        lastUpdated: new Date().toISOString(),
        order: 99,
        steps: generated.steps || [],
        aiPromptConfig: generated.aiPromptConfig || {},
        formMode: 'standard',
      };

      await saveTemplate.mutateAsync(newTemplate);
      setIsAiModalOpen(false);
      setAiForm({ trackName: '', specificTargetContext: '', methodologyContext: '', instruction: '' });
      toast.success('Template berhasil dirancang oleh Clario AI! Membuka Studio Canvas...');
      router.push(`/manajemen-kurasi/${newTemplate.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat memanggil AI.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER ACTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            Katalog Instrumen Asesmen & Kurasi
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola template kuesioner dinamis, indikator metrik radar, dan rubrik evaluasi AI dalam Studio Canvas layar penuh.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsAiModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 rounded-xl shadow-xs"
          >
            <Sparkles size={14} /> AI Architect Generator
          </Button>
          <Link href="/manajemen-kurasi/new">
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-bold rounded-xl gap-1.5"
            >
              <Plus size={14} /> Buat Manual (Studio)
            </Button>
          </Link>
        </div>
      </div>

      {/* GRID TEMPLATE CARDS */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm font-bold bg-white rounded-3xl border border-slate-200">
          Memuat template instrumen...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                      {tpl.curationDomain === 'PRODUCT_CURATION' ? (
                        <ShoppingBag size={20} />
                      ) : tpl.curationDomain === 'ALUMNI_ASSESSMENT' ? (
                        <GraduationCap size={20} />
                      ) : tpl.curationDomain === 'TENANT_INCUBATION' ? (
                        <Building size={20} />
                      ) : (
                        <Award size={20} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-tight group-hover:text-indigo-600 transition-colors">
                        {tpl.trackName}
                      </h4>
                      <span className="text-[10px] font-extrabold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {CURATION_DOMAIN_LABELS[tpl.curationDomain]}
                      </span>
                    </div>
                  </div>
                  <Badge variant={tpl.isActive ? 'default' : 'secondary'} className="text-[10px]">
                    {tpl.isActive ? 'Aktif' : 'Non-Aktif'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {tpl.trackDescription}
                </p>

                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2 mb-4 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Tahap / Seksi:</span>
                    <span className="font-bold text-slate-800">{tpl.steps?.length || 0} Langkah</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Pilar Metrik Radar:</span>
                    <span className="font-bold text-indigo-700">
                      {tpl.aiPromptConfig?.expectedMetrics?.length || 0} Metrik
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Blok Analisis AI:</span>
                    <span className="font-bold text-slate-800">
                      {tpl.aiPromptConfig?.expectedAnalysisBlocks?.length || 0} Blok
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">
                  v{tpl.version} • {new Date(tpl.lastUpdated).toLocaleDateString('id-ID')}
                </span>
                <div className="flex items-center gap-1.5">
                  <Link href={`/manajemen-kurasi/${tpl.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8.5 px-3 text-xs font-bold gap-1.5 rounded-xl border-slate-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200"
                    >
                      <Edit2 size={13} /> Buka Studio Canvas
                    </Button>
                  </Link>
                  {!tpl.id.startsWith('master-') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Hapus template "${tpl.trackName}"?`)) {
                          deleteTemplate.mutate(tpl.id);
                        }
                      }}
                      className="h-8.5 w-8.5 p-0 text-rose-500 hover:bg-rose-50 rounded-xl"
                    >
                      <Trash2 size={13} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL AI ARCHITECT GENERATOR */}
      {/* ======================================================== */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6 sm:p-8 border border-slate-200 animate-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600" /> Clario AI Template Architect
              </h3>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerateAiTemplate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nama Program Asesmen / Kurasi *</label>
                <Input
                  required
                  value={aiForm.trackName}
                  onChange={(e) => setAiForm({ ...aiForm, trackName: e.target.value })}
                  placeholder="Contoh: Uji Kompetensi Welder P3MI Jepang 2026"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Profil Target Peserta</label>
                <Input
                  value={aiForm.specificTargetContext}
                  onChange={(e) => setAiForm({ ...aiForm, specificTargetContext: e.target.value })}
                  placeholder="Contoh: Lulusan SMK Vokasi pengelasan 3G-6G"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Metodologi / Standar Acuan</label>
                <Input
                  value={aiForm.methodologyContext}
                  onChange={(e) => setAiForm({ ...aiForm, methodologyContext: e.target.value })}
                  placeholder="Contoh: Standar BNSP, ISO 9606-1, Standar Industri Luar Negeri"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Instruksi Khusus Tambahan</label>
                <Textarea
                  rows={3}
                  value={aiForm.instruction}
                  onChange={(e) => setAiForm({ ...aiForm, instruction: e.target.value })}
                  placeholder="Contoh: Wajib ada pertanyaan tentang penanganan cacat las dan bukti sertifikasi..."
                  className="text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAiModalOpen(false)}
                  className="text-xs font-bold rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isGeneratingAi}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 rounded-xl shadow-xs"
                >
                  {isGeneratingAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {isGeneratingAi ? 'Merancang Instrumen...' : 'Rancang dengan AI'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
