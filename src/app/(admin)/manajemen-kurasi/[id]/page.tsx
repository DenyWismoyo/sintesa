// Lokasi file: src/app/(admin)/manajemen-kurasi/[id]/page.tsx
// Studio Pembuatan & Kustomisasi Template Kurasi AI — Halaman Dedikasi Full Canvas (Bukan Modal)

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  CurationTemplate,
  CurationDomain,
  CURATION_DOMAIN_LABELS,
  FormField,
  FormStep,
  FieldType,
} from '@/types/curation.types';
import {
  useCurationTemplateDetail,
  useCurationMutations,
  useCurationTemplates,
} from '@/hooks/useCurationSystem';
import {
  ArrowLeft,
  Save,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  Layers,
  Settings2,
  Settings,
  BrainCircuit,
  FormInput,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  Building,
  GraduationCap,
  ShoppingBag,
  Award,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

function CurationStudioContent() {
  const params = useParams();
  const router = useRouter();
  const templateId = typeof params?.id === 'string' ? params.id : '';
  const isNew = templateId === 'new';

  const { data: existingTemplate, isLoading } = useCurationTemplateDetail(isNew ? null : templateId);
  const { saveTemplate } = useCurationMutations();

  // State Template yang sedang diedit
  const [templateState, setTemplateState] = useState<CurationTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'ai'>('form');
  const [expandedSteps, setExpandedSteps] = useState<number[]>([0]);
  const [stepToDelete, setStepToDelete] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Inisialisasi Template Baru atau Muat Template Tersimpan
  useEffect(() => {
    if (isNew && !templateState) {
      const defaultNew: CurationTemplate = {
        id: `tpl-${Date.now()}`,
        trackName: 'Instrumen Asesmen Baru',
        trackDescription: 'Instrumen evaluasi terpadu berbasis multi-indikator dan audit kecerdasan buatan.',
        trackIcon: 'ShieldCheck',
        curationDomain: 'CUSTOM_INNOVATION',
        category: 'Kustom Inovasi',
        isActive: true,
        version: 1,
        lastUpdated: new Date().toISOString(),
        order: 99,
        steps: [
          {
            stepNumber: 1,
            title: 'Identitas & Informasi Dasar',
            description: 'Data legalitas, profil pemohon, dan kontak resmi subjek.',
            fields: [
              { id: 'namaUsaha', label: 'Nama Subjek / Entitas Usaha', type: 'text', required: true, gridSpan: 2 },
              { id: 'kategoriBidang', label: 'Sektor / Bidang Fokus', type: 'text', required: true, gridSpan: 1 },
              { id: 'tahunBerdiri', label: 'Tahun Berdiri / Angkatan', type: 'number', required: false, gridSpan: 1 },
            ],
          },
        ],
        aiPromptConfig: {
          aiPersona: 'Lead Evaluator & Auditor Senior Solo Technopark',
          reportTone: 'consultative',
          gradingStrictness: 'standard',
          assessmentGoal: 'Evaluasi kesiapan komersialisasi, kepatuhan legalitas, dan standarisasi kualitas mutu.',
          targetAudience: 'umkm',
          formPurpose: 'assessment',
          expectedMetrics: ['Kualitas Produk', 'Kesiapan Operasional', 'Legalitas & HAKI', 'Kelayakan Finansial', 'Potensi Pasar'],
          expectedRecommendations: ['Strategi Peningkatan Mutu', 'Optimalisasi Distribusi Pasar', 'Mitigasi Risiko Regulasi'],
          expectedAnalysisBlocks: [
            'Kesiapan Produk & Mutu: Standarisasi formula, daya tahan kemasan, dan kapasitas produksi',
            'Aspek Legalitas & Sertifikasi: Kelengkapan NIB, Halal, BPOM, HAKI, dan uji lab',
            'Potensi Pasar & Komersialisasi: Target konsumen, kanal penjualan aktif, dan strategi penetapan harga',
          ],
          customReadinessTiers: [
            'Level 1: Pra-Inkubasi (Skor < 50) - Perlu pendampingan dasar dan perbaikan formula',
            'Level 2: Siap Pasar (Skor 50-74) - Kualitas stabil, butuh akselerasi distribusi',
            'Level 3: Siap Ekspor & Investasi (Skor >= 75) - Standar mutu tinggi dan legalitas lengkap',
          ],
          customUiLabels: {
            scoreLabel: 'AI Readiness Score',
            swotLabel: 'Capability Matrix (SWOT)',
            riskLabel: 'Critical Risks & Mitigation Map',
            roadmapLabel: 'Rekomendasi Strategis',
            executionLabel: 'Action Plan Timeline',
          },
          customScoringRubric: 'Berikan skor tinggi jika memiliki sertifikasi resmi, rekam jejak penjualan valid, dan foto produk jernih.',
          customSystemPrompt: 'Analisis jawaban secara objektif dan mendalam. Identifikasi celah risiko sebelum memberikan rekomendasi.',
        },
        formMode: 'standard',
      };
      setTemplateState(defaultNew);
    } else if (existingTemplate && !templateState) {
      setTemplateState(JSON.parse(JSON.stringify(existingTemplate)));
    }
  }, [isNew, existingTemplate, templateState]);

  if (isLoading || !templateState) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-bold uppercase tracking-wider">Memuat Studio Kurasi...</p>
      </div>
    );
  }

  // Helper Step Expansion
  const toggleStepExpansion = (stepIdx: number) => {
    setExpandedSteps((prev) =>
      prev.includes(stepIdx) ? prev.filter((idx) => idx !== stepIdx) : [...prev, stepIdx]
    );
  };

  // Helper Available Fields
  const getAllAvailableFields = () => {
    const fields: { id: string; label: string }[] = [];
    templateState.steps?.forEach((step) => {
      step.fields?.forEach((f) => {
        fields.push({ id: f.id, label: f.label });
      });
    });
    return fields;
  };

  // Step Management
  const addStep = () => {
    const currentSteps = templateState.steps || [];
    const newIdx = currentSteps.length;
    const newStep: FormStep = {
      stepNumber: newIdx + 1,
      title: `Langkah ${newIdx + 1}`,
      fields: [],
    };
    setTemplateState({
      ...templateState,
      steps: [...currentSteps, newStep],
    });
    setExpandedSteps([newIdx]);
    setIsDirty(true);
  };

  const executeRemoveStep = () => {
    if (stepToDelete === null) return;
    const newSteps = [...templateState.steps];
    newSteps.splice(stepToDelete, 1);
    newSteps.forEach((s, idx) => {
      s.stepNumber = idx + 1;
    });
    setTemplateState({
      ...templateState,
      steps: newSteps,
    });
    setStepToDelete(null);
    setIsDirty(true);
  };

  // Field Management
  const addField = (stepIndex: number) => {
    const newSteps = [...templateState.steps];
    const newField: FormField = {
      id: `field_${Date.now().toString().slice(-4)}`,
      label: 'Pertanyaan Baru',
      type: 'text',
      required: false,
      gridSpan: 2,
    };
    newSteps[stepIndex].fields = [...newSteps[stepIndex].fields, newField];
    setTemplateState({ ...templateState, steps: newSteps });
    setIsDirty(true);
  };

  const updateField = (stepIndex: number, fieldIndex: number, key: keyof FormField, value: any) => {
    const newSteps = [...templateState.steps];
    newSteps[stepIndex].fields[fieldIndex] = {
      ...newSteps[stepIndex].fields[fieldIndex],
      [key]: value,
    };
    setTemplateState({ ...templateState, steps: newSteps });
    setIsDirty(true);
  };

  const generateAutoIdFromLabel = (stepIndex: number, fieldIndex: number) => {
    const label = templateState.steps[stepIndex].fields[fieldIndex].label;
    const cleanedId = label
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    updateField(stepIndex, fieldIndex, 'id', cleanedId || `field_${Date.now().toString().slice(-4)}`);
  };

  const removeField = (stepIndex: number, fieldIndex: number) => {
    const newSteps = [...templateState.steps];
    newSteps[stepIndex].fields.splice(fieldIndex, 1);
    setTemplateState({ ...templateState, steps: newSteps });
    setIsDirty(true);
  };

  const moveField = (stepIndex: number, fieldIndex: number, direction: 'up' | 'down') => {
    const newSteps = [...templateState.steps];
    const fields = [...newSteps[stepIndex].fields];
    if (direction === 'up' && fieldIndex > 0) {
      [fields[fieldIndex - 1], fields[fieldIndex]] = [fields[fieldIndex], fields[fieldIndex - 1]];
    } else if (direction === 'down' && fieldIndex < fields.length - 1) {
      [fields[fieldIndex], fields[fieldIndex + 1]] = [fields[fieldIndex + 1], fields[fieldIndex]];
    }
    newSteps[stepIndex].fields = fields;
    setTemplateState({ ...templateState, steps: newSteps });
    setIsDirty(true);
  };

  // Helper AI Config
  const updateAiConfig = (key: string, value: any) => {
    setTemplateState({
      ...templateState,
      aiPromptConfig: {
        ...(templateState.aiPromptConfig || {}),
        [key]: value,
      } as any,
    });
    setIsDirty(true);
  };

  const updateUiLabel = (key: string, value: string) => {
    const currentLabels = templateState.aiPromptConfig?.customUiLabels || {};
    updateAiConfig('customUiLabels', { ...currentLabels, [key]: value });
  };

  const updateArrayItem = (key: string, idx: number, value: string) => {
    const currentArr = (templateState.aiPromptConfig?.[key as keyof typeof templateState.aiPromptConfig] as string[]) || [];
    const newArr = [...currentArr];
    newArr[idx] = value;
    updateAiConfig(key, newArr);
  };

  const removeArrayItem = (key: string, idx: number) => {
    const currentArr = (templateState.aiPromptConfig?.[key as keyof typeof templateState.aiPromptConfig] as string[]) || [];
    const newArr = [...currentArr];
    newArr.splice(idx, 1);
    updateAiConfig(key, newArr);
  };

  const addArrayItem = (key: string, defaultText: string) => {
    const currentArr = (templateState.aiPromptConfig?.[key as keyof typeof templateState.aiPromptConfig] as string[]) || [];
    const newArr = [...currentArr, defaultText];
    updateAiConfig(key, newArr);
  };

  const parseAnalysisBlock = (blockStr: string) => {
    if (!blockStr) return { title: '', subs: '' };
    const colonIndex = blockStr.indexOf(':');
    if (colonIndex === -1) return { title: blockStr, subs: '' };
    return { title: blockStr.slice(0, colonIndex).trim(), subs: blockStr.slice(colonIndex + 1).trim() };
  };

  const updateAnalysisBlock = (idx: number, newTitle: string, newSubs: string) => {
    const cleanTitle = newTitle.trim();
    const cleanSubs = newSubs.trim();
    const combinedValue = cleanTitle || cleanSubs ? `${cleanTitle}${cleanSubs ? `: ${cleanSubs}` : ''}` : '';
    updateArrayItem('expectedAnalysisBlocks', idx, combinedValue);
  };

  // Simpan Template
  const handleSave = async () => {
    if (!templateState.trackName.trim()) {
      toast.error('Nama Program Asesmen wajib diisi.');
      return;
    }
    setIsSaving(true);
    try {
      const payload: CurationTemplate = {
        ...templateState,
        lastUpdated: new Date().toISOString(),
        version: (templateState.version || 1) + 1,
      };
      await saveTemplate.mutateAsync(payload);
      setIsDirty(false);
      toast.success('Template berhasil disimpan ke sistem!');
      if (isNew) {
        router.replace(`/manajemen-kurasi/${payload.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan template.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalQuestions = templateState.steps?.reduce((acc, s) => acc + (s.fields?.length || 0), 0) || 0;

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-200">
      
      {/* ======================================================== */}
      {/* TOP BAR / STUDIO HEADER */}
      {/* ======================================================== */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Link
            href="/manajemen-kurasi?tab=template"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={15} /> Kembali ke Katalog Template Kurasi
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {templateState.trackName || 'Instrumen Asesmen Baru'}
            </h2>
            <Badge variant="outline" className="text-xs font-bold text-indigo-700 bg-indigo-50 border-indigo-200">
              {CURATION_DOMAIN_LABELS[templateState.curationDomain]}
            </Badge>
            {isDirty && (
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Ada Perubahan Belum Disimpan
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            ID: <code className="font-mono text-slate-600">{templateState.id}</code> • v{templateState.version || 1} • Diperbarui {new Date(templateState.lastUpdated).toLocaleDateString('id-ID')}
          </p>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/manajemen-kurasi?tab=template')}
            className="text-xs font-bold rounded-xl h-10 px-4"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl h-10 px-6 gap-2 shadow-xs"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {isSaving ? 'Menyimpan...' : 'Simpan & Terapkan Perubahan'}
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB NAVIGATION: DEDICATED FULL WIDTH */}
      {/* ======================================================== */}
      <div className="bg-white px-6 pt-3 rounded-2xl border border-slate-200 shadow-xs flex gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('form')}
          className={`pb-3.5 px-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'form'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FormInput size={16} /> Struktur Form & Pertanyaan
          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
            {templateState.steps?.length || 0} Langkah • {totalQuestions} Soal
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`pb-3.5 px-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'ai'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BrainCircuit size={16} /> Otak AI & Prompting
          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
            {templateState.aiPromptConfig?.expectedMetrics?.length || 0} Metrik • {templateState.aiPromptConfig?.expectedAnalysisBlocks?.length || 0} Blok
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: STRUKTUR FORM & PERTANYAAN (LEGA / FULL CANVAS) */}
      {/* ======================================================== */}
      {activeTab === 'form' && (
        <div className="space-y-6">
          
          {/* Metadata Umum Template */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Settings2 size={16} className="text-indigo-600" /> Pengaturan Dasar Modul Asesmen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Nama Program Asesmen / Kurasi *
                </label>
                <Input
                  value={templateState.trackName}
                  onChange={(e) => {
                    setTemplateState({ ...templateState, trackName: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="Contoh: Kurasi Produk E-Katalog Unggulan Solo"
                  className="text-sm font-bold h-11 bg-slate-50 border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Domain Kurasi
                </label>
                <select
                  value={templateState.curationDomain}
                  onChange={(e) => {
                    setTemplateState({
                      ...templateState,
                      curationDomain: e.target.value as CurationDomain,
                    });
                    setIsDirty(true);
                  }}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="PRODUCT_CURATION">Kurasi Produk E-Katalog</option>
                  <option value="ALUMNI_ASSESSMENT">Asesmen Kompetensi Alumni</option>
                  <option value="TENANT_INCUBATION">Inkubasi & Seleksi Tenant</option>
                  <option value="CUSTOM_INNOVATION">Inovasi & Krenova</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Deskripsi Panduan & Ruang Lingkup
                </label>
                <Textarea
                  rows={2}
                  value={templateState.trackDescription}
                  onChange={(e) => {
                    setTemplateState({ ...templateState, trackDescription: e.target.value });
                    setIsDirty(true);
                  }}
                  placeholder="Tuliskan tujuan evaluasi, profil target peserta, dan kriteria umum..."
                  className="text-xs bg-slate-50 border-slate-200 rounded-xl resize-none"
                />
              </div>
            </div>
          </div>

          {/* List Langkah / Steps */}
          {(!templateState.steps || templateState.steps.length === 0) ? (
            <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold text-sm">Belum ada seksi langkah formulir.</p>
            </div>
          ) : (
            templateState.steps.map((step, sIdx) => {
              const isExpanded = expandedSteps.includes(sIdx);
              return (
                <div
                  key={`step-${sIdx}`}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200"
                >
                  {/* STEP HEADER */}
                  <div
                    onClick={() => toggleStepExpansion(sIdx)}
                    className={`p-5 flex items-center justify-between cursor-pointer select-none transition-colors ${
                      isExpanded ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1">
                      <span
                        className={`flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black shrink-0 ${
                          isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {step.stepNumber}
                      </span>
                      {isExpanded ? (
                        <Input
                          value={step.title}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const newSteps = [...templateState.steps];
                            newSteps[sIdx].title = e.target.value;
                            setTemplateState({ ...templateState, steps: newSteps });
                            setIsDirty(true);
                          }}
                          className="bg-slate-800 border-slate-700 text-white font-bold h-10 w-full max-w-md text-sm rounded-xl"
                        />
                      ) : (
                        <h4 className="font-bold text-base">
                          {step.title}{' '}
                          <span className="text-slate-400 text-xs font-normal ml-2">
                            ({step.fields?.length || 0} Pertanyaan)
                          </span>
                        </h4>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isExpanded && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStepToDelete(sIdx);
                          }}
                          className="text-rose-400 hover:text-rose-300 hover:bg-slate-800 h-8 px-3 text-xs font-bold rounded-lg"
                        >
                          Hapus Seksi
                        </Button>
                      )}
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {/* STEP BODY */}
                  {isExpanded && (
                    <div className="p-6 bg-slate-50/50 space-y-6 border-t border-slate-200">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Deskripsi / Petunjuk Pengisian Langkah Ini (Opsional)
                        </label>
                        <Input
                          value={step.description || ''}
                          onChange={(e) => {
                            const newSteps = [...templateState.steps];
                            newSteps[sIdx].description = e.target.value;
                            setTemplateState({ ...templateState, steps: newSteps });
                            setIsDirty(true);
                          }}
                          placeholder="Contoh: Pastikan seluruh dokumen legalitas telah diunggah dalam format PDF/JPG..."
                          className="text-xs bg-white border-slate-200 rounded-xl h-10"
                        />
                      </div>

                      {/* QUESTIONS LIST */}
                      <div className="space-y-4">
                        {step.fields?.map((field, fIdx) => (
                          <div
                            key={`field-${sIdx}-${fIdx}`}
                            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-5 relative hover:border-indigo-300 transition-all"
                          >
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Label Pertanyaan *
                                </label>
                                <Input
                                  value={field.label}
                                  onChange={(e) => updateField(sIdx, fIdx, 'label', e.target.value)}
                                  placeholder="Tuliskan teks pertanyaan formulir..."
                                  className="text-sm font-bold bg-slate-50 border-slate-200 rounded-xl h-10"
                                />
                              </div>

                              <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Penjelasan / Panduan Tambahan (Opsional)
                                </label>
                                <Input
                                  value={field.description || ''}
                                  onChange={(e) => updateField(sIdx, fIdx, 'description', e.target.value)}
                                  placeholder="Penjelasan cara mengisi atau batas ketentuan..."
                                  className="text-xs bg-slate-50 border-slate-200 rounded-lg h-9"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Tipe Input Form
                                </label>
                                <select
                                  value={field.type}
                                  onChange={(e) =>
                                    updateField(sIdx, fIdx, 'type', e.target.value as FieldType)
                                  }
                                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                                >
                                  <option value="text">Teks Pendek</option>
                                  <option value="textarea">Teks Panjang (Uraian)</option>
                                  <option value="number">Angka / Nominal</option>
                                  <option value="date">Tanggal</option>
                                  <option value="select">Dropdown Pilihan</option>
                                  <option value="radio">Pilihan Tunggal (Radio)</option>
                                  <option value="checkbox">Pilihan Ganda (Checkbox)</option>
                                  <option value="file">Unggah Dokumen / Foto Bukti</option>
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Key Database (ID)
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => generateAutoIdFromLabel(sIdx, fIdx)}
                                    className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
                                    title="Buat slug ID otomatis dari label"
                                  >
                                    <Sparkles size={11} /> Auto-ID
                                  </button>
                                </div>
                                <Input
                                  value={field.id}
                                  onChange={(e) =>
                                    updateField(
                                      sIdx,
                                      fIdx,
                                      'id',
                                      e.target.value.replace(/[^a-zA-Z0-9_]/g, '')
                                    )
                                  }
                                  className="text-xs font-mono font-bold text-indigo-700 bg-slate-50 border-slate-200 rounded-xl h-10"
                                />
                              </div>

                              {/* Checkbox Wajib & Lebar Penuh */}
                              <div className="flex items-center gap-6 pt-1 md:col-span-2">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={field.required || false}
                                    onChange={(e) => updateField(sIdx, fIdx, 'required', e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                                  />
                                  Wajib Diisi (Required)
                                </label>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={field.gridSpan === 2}
                                    onChange={(e) =>
                                      updateField(sIdx, fIdx, 'gridSpan', e.target.checked ? 2 : 1)
                                    }
                                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                                  />
                                  Lebar Penuh (100% Kolom)
                                </label>
                              </div>

                              {/* LOGIKA CABANG ALIRAN PERTANYAAN (SHOW IF) */}
                              <div className="md:col-span-2 space-y-2 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                <label className="text-[10px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                                  <GitBranch size={14} className="text-indigo-600" /> Logika Aliran Percabangan (Tampil Jika...)
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  <select
                                    value={field.showIf ? 'conditional' : 'always'}
                                    onChange={(e) => {
                                      if (e.target.value === 'always') {
                                        updateField(sIdx, fIdx, 'showIf', undefined);
                                      } else {
                                        const avail = getAllAvailableFields().filter(
                                          (af) => af.id !== field.id
                                        );
                                        updateField(sIdx, fIdx, 'showIf', {
                                          fieldId: avail[0]?.id || '',
                                          operator: 'equals',
                                          value: '',
                                        });
                                      }
                                    }}
                                    className="h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
                                  >
                                    <option value="always">Tampilkan Selalu</option>
                                    <option value="conditional">Tampilkan Kondisional...</option>
                                  </select>

                                  {field.showIf && (
                                    <>
                                      <select
                                        value={field.showIf.fieldId}
                                        onChange={(e) =>
                                          updateField(sIdx, fIdx, 'showIf', {
                                            ...field.showIf,
                                            fieldId: e.target.value,
                                          })
                                        }
                                        className="h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
                                      >
                                        {getAllAvailableFields()
                                          .filter((af) => af.id !== field.id)
                                          .map((af) => (
                                            <option key={af.id} value={af.id}>
                                              {af.label} ({af.id})
                                            </option>
                                          ))}
                                      </select>
                                      <Input
                                        placeholder="Nilai Pemicu (Cth: Ya)"
                                        value={String(field.showIf.value ?? '')}
                                        onChange={(e) =>
                                          updateField(sIdx, fIdx, 'showIf', {
                                            ...field.showIf,
                                            value: e.target.value,
                                          })
                                        }
                                        className="h-9 text-xs bg-white border-slate-200 rounded-lg"
                                      />
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* SCORING MATRIX BOBOT JAWABAN */}
                              {(field.type === 'radio' ||
                                field.type === 'checkbox' ||
                                field.type === 'select') && (
                                <div className="md:col-span-2 space-y-2.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                                    Opsi Jawaban & Matrix Bobot Skor AI (0 - 100)
                                  </label>
                                  <div className="space-y-2">
                                    {(field.options || []).map((opt, optIdx) => {
                                      const optLabel = typeof opt === 'object' ? opt.label : String(opt);
                                      const optWeight = typeof opt === 'object' ? opt.weight || 0 : 0;
                                      return (
                                        <div
                                          key={optIdx}
                                          className="flex items-center gap-2 bg-white p-2.5 border border-slate-200 rounded-xl shadow-2xs"
                                        >
                                          <Input
                                            value={optLabel}
                                            onChange={(e) => {
                                              const newOpts = [...(field.options || [])];
                                              newOpts[optIdx] = {
                                                label: e.target.value,
                                                value: e.target.value,
                                                weight: optWeight,
                                              };
                                              updateField(sIdx, fIdx, 'options', newOpts);
                                            }}
                                            placeholder="Teks Pilihan..."
                                            className="h-8 text-xs bg-white flex-1"
                                          />
                                          <div className="flex items-center gap-1 shrink-0">
                                            <span className="text-[9px] font-black text-indigo-600 uppercase">
                                              Bobot:
                                            </span>
                                            <Input
                                              type="number"
                                              min={0}
                                              max={100}
                                              value={optWeight}
                                              onChange={(e) => {
                                                const newOpts = [...(field.options || [])];
                                                newOpts[optIdx] = {
                                                  label: optLabel,
                                                  value: optLabel,
                                                  weight: parseInt(e.target.value) || 0,
                                                };
                                                updateField(sIdx, fIdx, 'options', newOpts);
                                              }}
                                              className="w-16 h-8 text-center text-xs font-bold text-indigo-700 bg-indigo-50 border-indigo-200"
                                            />
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                              const newOpts = [...(field.options || [])];
                                              newOpts.splice(optIdx, 1);
                                              updateField(sIdx, fIdx, 'options', newOpts);
                                            }}
                                            className="h-8 w-8 text-slate-400 hover:text-rose-600 p-0 rounded-lg"
                                          >
                                            <Trash2 size={13} />
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const currentOpts = field.options || [];
                                      const newOpts = [
                                        ...currentOpts,
                                        {
                                          label: `Pilihan ${currentOpts.length + 1}`,
                                          value: `Pilihan ${currentOpts.length + 1}`,
                                          weight: 50,
                                        },
                                      ];
                                      updateField(sIdx, fIdx, 'options', newOpts);
                                    }}
                                    className="w-full h-8 text-[11px] border-dashed font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl"
                                  >
                                    <Plus size={13} className="mr-1" /> Tambah Pilihan Berbobot
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* REORDER & DELETE */}
                            <div className="flex md:flex-col gap-1.5 items-center justify-center pt-3 md:pt-0 md:pl-3 border-t md:border-t-0 md:border-l border-slate-100 shrink-0">
                              <button
                                type="button"
                                onClick={() => moveField(sIdx, fIdx, 'up')}
                                disabled={fIdx === 0}
                                className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl disabled:opacity-30"
                                title="Geser Naik"
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveField(sIdx, fIdx, 'down')}
                                disabled={fIdx === step.fields.length - 1}
                                className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl disabled:opacity-30"
                                title="Geser Turun"
                              >
                                <ArrowDown size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeField(sIdx, fIdx)}
                                className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl"
                                title="Hapus Pertanyaan"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addField(sIdx)}
                          className="w-full border-dashed border-2 border-indigo-200 h-11 text-xs font-bold text-indigo-700 hover:bg-indigo-50 rounded-2xl"
                        >
                          <Plus size={14} className="mr-1.5" /> Tambah Pertanyaan di Langkah Ini
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          <Button
            type="button"
            onClick={addStep}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 h-12 font-bold text-xs rounded-2xl border-dashed border-2 border-slate-300"
          >
            <Plus size={16} className="mr-1.5" /> Tambah Seksi Langkah Baru
          </Button>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: OTAK AI & PROMPTING (LEGA / FULL CANVAS) */}
      {/* ======================================================== */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          
          {/* Visual Report Labels */}
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <Settings size={18} className="text-indigo-600" /> Kustomisasi Label Visual Laporan Hasil Asesmen
            </h4>
            <p className="text-xs text-slate-500">
              Ubah penamaan judul seksi pada dokumen hasil evaluasi akhir yang disajikan kepada peserta dan kurator.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { key: 'scoreLabel', title: 'Skor Kesiapan', def: 'AI Readiness Score' },
                { key: 'swotLabel', title: 'Analisis SWOT', def: 'Capability Matrix (SWOT)' },
                { key: 'riskLabel', title: 'Mitigasi Risiko', def: 'Critical Risks & Mitigation Map' },
                { key: 'roadmapLabel', title: 'Rekomendasi', def: 'Rekomendasi Strategis' },
                { key: 'executionLabel', title: 'Action Plan', def: 'Action Plan Timeline' },
              ].map((item) => (
                <div key={item.key} className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 capitalize">{item.title}</span>
                  <Input
                    value={
                      (templateState.aiPromptConfig?.customUiLabels as any)?.[item.key] || ''
                    }
                    onChange={(e) => updateUiLabel(item.key, e.target.value)}
                    placeholder={item.def}
                    className="h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Karakter Dasar & Sifat Penilaian AI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Persona & Peran AI */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3.5">
              <h4 className="font-black text-slate-800 text-xs border-l-3 border-indigo-600 pl-2 uppercase tracking-wider">
                Karakter Dasar AI
              </h4>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Persona & Peran AI</label>
                <Input
                  value={templateState.aiPromptConfig?.aiPersona || ''}
                  onChange={(e) => updateAiConfig('aiPersona', e.target.value)}
                  placeholder="Contoh: Lead Auditor Mutu Vokasi"
                  className="text-xs bg-slate-50 border-slate-200 rounded-xl h-10 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Fokus Analisis / Goal</label>
                <Textarea
                  rows={3}
                  value={templateState.aiPromptConfig?.assessmentGoal || ''}
                  onChange={(e) => updateAiConfig('assessmentGoal', e.target.value)}
                  placeholder="Contoh: Evaluasi kesiapan kurasi produk ekspor..."
                  className="text-xs bg-slate-50 border-slate-200 rounded-xl resize-none"
                />
              </div>
            </div>

            {/* Sifat Penilaian */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3.5">
              <h4 className="font-black text-slate-800 text-xs border-l-3 border-emerald-600 pl-2 uppercase tracking-wider">
                Sifat Penilaian
              </h4>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Keketatan Skor</label>
                <select
                  value={templateState.aiPromptConfig?.gradingStrictness || 'standard'}
                  onChange={(e) => updateAiConfig('gradingStrictness', e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="supportive">Suportif & Edukatif</option>
                  <option value="standard">Standar Objektif</option>
                  <option value="strict">Sangat Ketat (Audit Mutu Industri)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Gaya Bahasa Laporan</label>
                <select
                  value={templateState.aiPromptConfig?.reportTone || 'consultative'}
                  onChange={(e) => updateAiConfig('reportTone', e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="consultative">Konsultatif & Solutif</option>
                  <option value="investigative">Investigatif & Tajam</option>
                  <option value="academic">Akademis Formal</option>
                </select>
              </div>
            </div>

            {/* Skala Kepadatan Output */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3.5">
              <h4 className="font-black text-slate-800 text-xs border-l-3 border-blue-600 pl-2 uppercase tracking-wider">
                Skala Kepadatan Output
              </h4>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Target Metrik Radar (Pilar)</label>
                <Input
                  type="number"
                  min={3}
                  max={12}
                  value={templateState.aiPromptConfig?.expectedMetrics?.length || 5}
                  disabled
                  className="text-xs bg-slate-100 border-slate-200 rounded-xl h-10 font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Dihitung otomatis dari daftar metrik radar di bawah.</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Target Blok Analisis</label>
                <Input
                  type="number"
                  min={2}
                  max={10}
                  value={templateState.aiPromptConfig?.expectedAnalysisBlocks?.length || 3}
                  disabled
                  className="text-xs bg-slate-100 border-slate-200 rounded-xl h-10 font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Dihitung otomatis dari daftar blok analisis di bawah.</p>
              </div>
            </div>

          </div>

          {/* MANAJEMEN BLOK ANALISIS */}
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                  Manajemen Blok Analisis Spesifik (Kategori & Sub-Indikator)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap blok mewakili aspek peninjauan terpisah di mana AI akan membuat evaluasi detail dan rekomendasi per sub-indikator.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  addArrayItem(
                    'expectedAnalysisBlocks',
                    'Kesiapan Aspek Baru: Rincian sub-indikator yang dinilai'
                  )
                }
                className="text-xs font-bold gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50 rounded-xl"
              >
                <Plus size={13} /> Tambah Blok
              </Button>
            </div>

            <div className="space-y-3">
              {(templateState.aiPromptConfig?.expectedAnalysisBlocks || []).map((item, bIdx) => {
                const { title, subs } = parseAnalysisBlock(item);
                return (
                  <div
                    key={bIdx}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex gap-3 items-start"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-700 uppercase">
                          Judul Blok Aspek
                        </label>
                        <Input
                          value={title}
                          onChange={(e) => updateAnalysisBlock(bIdx, e.target.value, subs)}
                          placeholder="Contoh: Kesiapan Legalitas"
                          className="text-xs font-bold bg-white border-slate-200 rounded-xl h-9"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-emerald-700 uppercase">
                          Indikator Sub-Poin (Pisahkan Koma)
                        </label>
                        <Input
                          value={subs}
                          onChange={(e) => updateAnalysisBlock(bIdx, title, e.target.value)}
                          placeholder="Contoh: NIB, Izin Edar BPOM, Sertifikat Halal, HAKI Merek"
                          className="text-xs bg-white border-slate-200 rounded-xl h-9"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeArrayItem('expectedAnalysisBlocks', bIdx)}
                      className="h-9 w-9 text-slate-400 hover:text-rose-600 p-0 rounded-lg shrink-0 mt-5"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* METRIK RADAR, TIERS LEVEL & REKOMENDASI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Metrik Radar */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-800 block mb-1">
                  Pilar Metrik Radar (0 - 100)
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Pilar performa utama yang dikonversi menjadi grafik visual radar.
                </p>
                <div className="space-y-2">
                  {(templateState.aiPromptConfig?.expectedMetrics || []).map((m, mIdx) => (
                    <div key={mIdx} className="flex items-center gap-1.5">
                      <Input
                        value={m}
                        onChange={(e) => updateArrayItem('expectedMetrics', mIdx, e.target.value)}
                        className="h-8.5 text-xs bg-slate-50 border-slate-200 rounded-xl flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeArrayItem('expectedMetrics', mIdx)}
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 p-0 rounded-lg shrink-0"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem('expectedMetrics', 'Pilar Baru')}
                className="w-full mt-3 border-dashed text-indigo-600 border-indigo-200 h-9 text-[11px] font-bold rounded-xl"
              >
                <Plus size={13} className="mr-1" /> Tambah Metrik
              </Button>
            </div>

            {/* Klaster Hasil Akhir (Tiers Level) */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-800 block mb-1">
                  Klaster Hasil Akhir (Tiers Level)
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Definisi ambang batas tingkat kelulusan atau kesiapan subjek.
                </p>
                <div className="space-y-2">
                  {(templateState.aiPromptConfig?.customReadinessTiers || []).map((tier, tIdx) => (
                    <div key={tIdx} className="flex items-center gap-1.5">
                      <Input
                        value={tier}
                        onChange={(e) => updateArrayItem('customReadinessTiers', tIdx, e.target.value)}
                        className="h-8.5 text-xs bg-slate-50 border-slate-200 rounded-xl flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeArrayItem('customReadinessTiers', tIdx)}
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 p-0 rounded-lg shrink-0"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem('customReadinessTiers', 'Level Baru: Kriteria skor')}
                className="w-full mt-3 border-dashed text-indigo-600 border-indigo-200 h-9 text-[11px] font-bold rounded-xl"
              >
                <Plus size={13} className="mr-1" /> Tambah Tier
              </Button>
            </div>

            {/* Target Rekomendasi */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-800 block mb-1">
                  Target Rekomendasi Tindak Lanjut
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Area perbaikan yang wajib dihasilkan oleh engine AI.
                </p>
                <div className="space-y-2">
                  {(templateState.aiPromptConfig?.expectedRecommendations || []).map((rec, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-1.5">
                      <Input
                        value={rec}
                        onChange={(e) => updateArrayItem('expectedRecommendations', rIdx, e.target.value)}
                        className="h-8.5 text-xs bg-slate-50 border-slate-200 rounded-xl flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeArrayItem('expectedRecommendations', rIdx)}
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 p-0 rounded-lg shrink-0"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayItem('expectedRecommendations', 'Area Rekomendasi')}
                className="w-full mt-3 border-dashed text-indigo-600 border-indigo-200 h-9 text-[11px] font-bold rounded-xl"
              >
                <Plus size={13} className="mr-1" /> Tambah Rekomendasi
              </Button>
            </div>

          </div>

          {/* ADVANCED PROMPTING TEXTAREAS */}
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-5">
            <h4 className="font-black text-slate-800 text-sm border-l-3 border-rose-500 pl-2 uppercase tracking-wider">
              Advanced AI Prompting Rules & Rubrics
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-1.5 p-5 bg-amber-50/60 border border-amber-200 rounded-2xl">
                <label className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                  Rubrik Penilaian Objektif (Custom Scoring Rubric)
                </label>
                <Textarea
                  rows={4}
                  value={templateState.aiPromptConfig?.customScoringRubric || ''}
                  onChange={(e) => updateAiConfig('customScoringRubric', e.target.value)}
                  placeholder="Contoh: Beri nilai 90-100 jika memiliki NIB dan sertifikasi lengkap. Kurangi 20 poin jika tidak ada foto bukti fisik."
                  className="text-xs bg-white border-amber-200 rounded-xl resize-none"
                />
              </div>

              <div className="space-y-1.5 p-5 bg-indigo-50/60 border border-indigo-200 rounded-2xl">
                <label className="text-[11px] font-black uppercase tracking-wider text-indigo-900 block">
                  Aturan Sistem & Kondisi If-Then (Custom System Rules)
                </label>
                <Textarea
                  rows={4}
                  value={templateState.aiPromptConfig?.customSystemPrompt || ''}
                  onChange={(e) => updateAiConfig('customSystemPrompt', e.target.value)}
                  placeholder="Contoh: Jika peserta menjawab kapasitas produksi < 100 unit, kategorikan sebagai Usaha Mikro..."
                  className="text-xs bg-white border-indigo-200 rounded-xl resize-none"
                />
              </div>

              <div className="space-y-1.5 p-5 bg-rose-50/60 border border-rose-200 rounded-2xl">
                <label className="text-[11px] font-black uppercase tracking-wider text-rose-900 block">
                  Larangan & Batasan AI (Negative Prompts)
                </label>
                <Textarea
                  rows={3}
                  value={templateState.aiPromptConfig?.negativePrompts || ''}
                  onChange={(e) => updateAiConfig('negativePrompts', e.target.value)}
                  placeholder="Contoh: Jangan pernah memberikan skor sempurna jika ada dokumen yang belum diverifikasi..."
                  className="text-xs bg-white border-rose-200 rounded-xl resize-none"
                />
              </div>

              <div className="space-y-1.5 p-5 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                <label className="text-[11px] font-black uppercase tracking-wider text-emerald-900 block">
                  Panduan Format Teks Output (Format Instructions)
                </label>
                <Textarea
                  rows={3}
                  value={templateState.aiPromptConfig?.formatInstructions || ''}
                  onChange={(e) => updateAiConfig('formatInstructions', e.target.value)}
                  placeholder="Contoh: Tuliskan rekomendasi dalam format poin bernomor dan awali dengan kalimat aksi konkret..."
                  className="text-xs bg-white border-emerald-200 rounded-xl resize-none"
                />
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* STICKY BOTTOM BAR ACTION */}
      {/* ======================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 px-6 py-3.5 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="font-bold text-slate-800">
            Total {templateState.steps?.length || 0} Langkah • {totalQuestions} Pertanyaan
          </span>
          {isDirty && (
            <span className="text-amber-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Perubahan belum disimpan
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/manajemen-kurasi?tab=template')}
            disabled={isSaving}
            className="text-xs font-bold rounded-xl h-10 px-4"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl h-10 px-7 gap-2 shadow-xs"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {isSaving ? 'Menyimpan...' : 'Simpan & Terapkan Perubahan'}
          </Button>
        </div>
      </div>

      {/* MODAL HAPUS LANGKAH / STEP */}
      {stepToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-800">Hapus Seksi Langkah Ini?</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Seluruh pertanyaan dan variabel isian di dalam langkah ini akan dihapus permanen dari template.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setStepToDelete(null)}
                className="flex-1 text-xs font-bold rounded-xl"
              >
                Batal
              </Button>
              <Button
                onClick={executeRemoveStep}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
              >
                Ya, Hapus
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function CurationStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-xs font-bold uppercase tracking-wider">Menyiapkan Studio Kurasi...</p>
        </div>
      }
    >
      <CurationStudioContent />
    </Suspense>
  );
}
