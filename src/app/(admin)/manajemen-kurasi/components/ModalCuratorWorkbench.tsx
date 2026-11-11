// Lokasi file: src/app/(admin)/manajemen-kurasi/components/ModalCuratorWorkbench.tsx
// Curator Validation Workbench — Dual-Tab Human-in-the-Loop Evaluation, Block Notes & Sync

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Award,
  Sparkles,
  Save,
  CheckCircle2,
  Share2,
  Mic,
  MicOff,
  Building,
  GraduationCap,
  ShoppingBag,
  ExternalLink,
  Rocket,
  AlertTriangle,
  FileText,
  Loader2,
  Check,
  Briefcase,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CurationAssessment, CuratorAssessment } from '@/types/curation.types';
import { useCurationMutations } from '@/hooks/useCurationSystem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  assessment: CurationAssessment | null;
}

export default function ModalCuratorWorkbench({ isOpen, onClose, assessment }: Props) {
  const { updateValidation, syncToCatalog, syncToAlumni, syncToTenant } = useCurationMutations();

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'evaluasi' | 'input'>('evaluasi');

  // Curator Evaluation Form State
  const [verifiedScore, setVerifiedScore] = useState<number>(0);
  const [verifiedLevel, setVerifiedLevel] = useState<string>('');
  const [finalRoute, setFinalRoute] = useState<string>('');
  const [curatorNotes, setCuratorNotes] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [customBlockNotes, setCustomBlockNotes] = useState<Record<string, string>>({});
  const [documentNotes, setDocumentNotes] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [catalogPrice, setCatalogPrice] = useState<number>(0);

  // Auto-Save Status
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (assessment) {
      const cur = assessment.curatorAssessment;
      setVerifiedScore(cur?.verifiedScore ?? assessment.score ?? assessment.aiResult?.totalScore ?? 0);
      setVerifiedLevel(cur?.verifiedLevel ?? assessment.readinessLevel ?? assessment.aiResult?.readinessLevel ?? 'Market Ready');
      setFinalRoute(cur?.finalRoute ?? assessment.aiResult?.incubationRoute ?? 'Pendampingan Reguler');
      setCuratorNotes(cur?.curatorNotes ?? '');
      setTagsInput(cur?.tags?.join(', ') ?? '');
      setCustomBlockNotes(cur?.customBlockNotes ?? {});
      setDocumentNotes(cur?.documentNotes ?? '');
      setCatalogPrice(Number(assessment.formData?.hargaJual || 0));
      isInitialMount.current = true;
    }
  }, [assessment]);

  // Debounced Auto-Save Draft
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!assessment || assessment.status === 'Curator_Validated') return;

    setAutoSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        const payload: CuratorAssessment = {
          verifiedScore: Number(verifiedScore),
          verifiedLevel,
          finalRoute,
          curatorNotes,
          tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
          customBlockNotes,
          documentNotes,
          validatedAt: Date.now(),
          validatedBy: 'Admin Kurator STP',
        };
        await updateValidation.mutateAsync({
          assessmentId: assessment.id,
          curatorData: payload,
          isFinal: false,
        });
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2500);
      } catch (e) {
        setAutoSaveStatus('idle');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [verifiedScore, verifiedLevel, finalRoute, curatorNotes, tagsInput, customBlockNotes, documentNotes]);

  if (!isOpen || !assessment) return null;

  const isAlreadyValidated = assessment.status === 'Curator_Validated';

  // Toggle Web Speech API Dikte Suara
  const toggleVoiceRecord = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Browser Anda belum mendukung fitur Dikte Suara.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCuratorNotes((prev) => (prev ? prev + ' ' : '') + transcript + '. ');
        setIsListening(false);
        toast.success('Suara berhasil ditranskripsikan!');
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    }
  };

  const handleSaveDraft = async () => {
    const payload: CuratorAssessment = {
      verifiedScore: Number(verifiedScore),
      verifiedLevel,
      finalRoute,
      curatorNotes,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      customBlockNotes,
      documentNotes,
      validatedAt: Date.now(),
      validatedBy: 'Admin Kurator STP',
    };
    await updateValidation.mutateAsync({
      assessmentId: assessment.id,
      curatorData: payload,
      isFinal: false,
    });
    toast.success('Draf evaluasi berhasil disimpan.');
  };

  const handleFinalize = async () => {
    if (!curatorNotes.trim()) {
      toast.error('Catatan verifikasi kurator wajib diisi sebelum finalisasi.');
      return;
    }
    const payload: CuratorAssessment = {
      verifiedScore: Number(verifiedScore),
      verifiedLevel,
      finalRoute,
      curatorNotes,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      customBlockNotes,
      documentNotes,
      validatedAt: Date.now(),
      validatedBy: 'Admin Kurator STP',
    };
    await updateValidation.mutateAsync({
      assessmentId: assessment.id,
      curatorData: payload,
      isFinal: true,
    });
    toast.success('Hasil asesmen berhasil difinalisasi!');
  };

  const handleShareWhatsApp = () => {
    const phone = assessment.whatsapp || assessment.formData?.whatsapp || assessment.formData?.noHpWa || '';
    const formattedPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone;
    const text = `Halo *${assessment.subjekName}*,\n\nTim Kurator Solo Technopark telah menyelesaikan verifikasi hasil asesmen/kurasi Anda pada program *${assessment.trackType}*:\n\n*Skor Akhir Terverifikasi:* ${verifiedScore}/100\n*Level Kesiapan:* ${verifiedLevel}\n*Rute Rekomendasi:* ${finalRoute}\n\n*Catatan Kurator:*\n"${curatorNotes || 'Pertahankan dan terus tingkatkan kualitas.'}"\n\nSalam hangat,\n*Pusat Kurasi & Inovasi Solo Technopark*`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl w-full max-w-6xl max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden border-0 sm:border border-slate-200 animate-in zoom-in-95">
        
        {/* HEADER WORKBENCH */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              {assessment.curationDomain === 'PRODUCT_CURATION' ? (
                <ShoppingBag size={20} />
              ) : assessment.curationDomain === 'ALUMNI_ASSESSMENT' ? (
                <GraduationCap size={20} />
              ) : (
                <Building size={20} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">{assessment.subjekName}</h3>
                {isAlreadyValidated ? (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/40">
                    Tervalidasi Final
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-500/40">
                    Menunggu Validasi
                  </span>
                )}
                {autoSaveStatus === 'saving' && (
                  <span className="text-[10px] text-indigo-400 flex items-center gap-1 font-bold animate-pulse ml-2">
                    <Loader2 size={11} className="animate-spin" /> Menyimpan...
                  </span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold ml-2">
                    <Check size={12} /> Draf Tersimpan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {assessment.trackType} • ID: <code className="font-mono text-slate-300">{assessment.id.slice(0, 8)}</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* TAB NAVIGATOR */}
        <div className="flex px-6 pt-2 bg-slate-100 border-b border-slate-200 shrink-0 gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('evaluasi')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'evaluasi'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck size={16} /> Evaluasi & Kalibrasi Kurator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('input')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'input'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase size={16} /> Data Input Formulir Peserta ({Object.keys(assessment.formData || {}).length} Field)
          </button>
        </div>

        {/* WORKBENCH BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar bg-slate-50/50">
          
          {/* ======================================================== */}
          {/* TAB 1: EVALUASI & KALIBRASI KURATOR */}
          {/* ======================================================== */}
          {activeTab === 'evaluasi' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* KOLOM KIRI: ANALISIS AI & DETAIL (7 COLS) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* AI Result Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                      <Sparkles size={16} /> Clario AI Pre-Assessment Summary
                    </h4>
                    <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Confidence: {assessment.aiResult?.dataConfidenceScore || 85}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase">AI Score</span>
                      <div className="text-2xl font-black text-indigo-900 mt-0.5">
                        {assessment.aiResult?.totalScore || assessment.score || 0}
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">AI Readiness</span>
                      <div className="text-xs font-black text-emerald-900 mt-1 truncate">
                        {assessment.aiResult?.readinessLevel || 'N/A'}
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                      <span className="text-[10px] font-bold text-purple-600 uppercase">Rute</span>
                      <div className="text-xs font-black text-purple-900 mt-1 truncate">
                        {assessment.aiResult?.incubationRoute || 'Reguler'}
                      </div>
                    </div>
                  </div>

                  {assessment.aiResult?.executiveSummary && (
                    <div className="text-xs font-medium text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                      {assessment.aiResult.executiveSummary}
                    </div>
                  )}

                  {/* Radar Breakdown Metrics */}
                  {assessment.aiResult?.metrics && assessment.aiResult.metrics.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Breakdown Pilar Penilaian:</p>
                      <div className="space-y-1.5">
                        {assessment.aiResult.metrics.map((m, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-100"
                          >
                            <span className="font-semibold text-slate-700">{m.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${m.score}%` }} />
                              </div>
                              <span className="font-bold text-indigo-700 w-8 text-right">{m.score}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Forensics File Insights */}
                  {assessment.aiResult?.fileAnalysisInsights && (
                    <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <span className="font-bold flex items-center gap-1.5 text-amber-800">
                        <FileText size={14} /> Temuan Forensik Bukti Fisik:
                      </span>
                      <p className="mt-1 text-[11px] leading-relaxed">
                        {assessment.aiResult.fileAnalysisInsights.documentQuality}
                      </p>
                    </div>
                  )}
                </div>

                {/* Catatan Khusus per Blok / Aspek */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Layers size={15} className="text-indigo-600" /> Catatan Spesifik per Blok Domain / Aspek
                  </h4>
                  <p className="text-xs text-slate-500">
                    Tuliskan catatan verifikasi lapangan khusus untuk setiap aspek pemeriksaan yang relevan.
                  </p>
                  <div className="space-y-3">
                    {['Kualitas & Mutu Produk', 'Legalitas & Perizinan', 'Kapasitas Produksi & Finansial', 'Kesiapan Pasar & Digital'].map((blockName) => (
                      <div key={blockName} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">{blockName}</label>
                        <Input
                          value={customBlockNotes[blockName] || ''}
                          onChange={(e) =>
                            setCustomBlockNotes((prev) => ({ ...prev, [blockName]: e.target.value }))
                          }
                          placeholder={`Catatan kurator untuk ${blockName.toLowerCase()}...`}
                          className="h-8 text-xs bg-white border-slate-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* KOLOM KANAN: WORKBENCH KALIBRASI KURATOR (5 COLS) */}
              <div className="lg:col-span-5 space-y-6">
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-emerald-600" /> Kalibrasi Skor Kurator
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleVoiceRecord}
                      className={`h-7 px-2.5 text-[11px] gap-1 rounded-lg ${
                        isListening ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse' : 'text-slate-600'
                      }`}
                    >
                      {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                      {isListening ? 'Merekam...' : 'Dikte Suara'}
                    </Button>
                  </div>

                  {/* Slider Skor Terverifikasi */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-slate-700">Skor Terverifikasi (0 - 100):</label>
                      <span className="text-xl font-black text-emerald-700">{verifiedScore}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={verifiedScore}
                      onChange={(e) => setVerifiedScore(Number(e.target.value))}
                      className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Level Kesiapan & Rute */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Level Kesiapan:</label>
                      <Input
                        value={verifiedLevel}
                        onChange={(e) => setVerifiedLevel(e.target.value)}
                        placeholder="Contoh: Retail Ready"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Rekomendasi Rute:</label>
                      <Input
                        value={finalRoute}
                        onChange={(e) => setFinalRoute(e.target.value)}
                        placeholder="Contoh: Akselerasi Ekspor"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* Label Tags */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Tags / Lencana Kompetensi:</label>
                    <Input
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="Halal, BPOM, Welder 6G, Siap P3MI"
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* Catatan Lapangan Kurator */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Catatan Verifikasi Kurator Lapangan:</label>
                    <Textarea
                      rows={4}
                      value={curatorNotes}
                      onChange={(e) => setCuratorNotes(e.target.value)}
                      placeholder="Tuliskan catatan inspeksi fisik, hasil wawancara, atau instruksi perbaikan..."
                      className="text-xs resize-none"
                    />
                  </div>

                  {/* Tombol Simpan Draf & Finalisasi */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={updateValidation.isPending}
                      className="text-xs font-bold h-9"
                    >
                      <Save size={14} className="mr-1.5" /> Simpan Draf
                    </Button>
                    <Button
                      onClick={handleFinalize}
                      disabled={updateValidation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 shadow-sm"
                    >
                      <CheckCircle2 size={14} className="mr-1.5" /> Finalisasi Kurasi
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={handleShareWhatsApp}
                    className="w-full text-emerald-700 hover:bg-emerald-50 text-xs font-bold h-8.5 gap-1.5"
                  >
                    <Share2 size={14} /> Bagikan Ringkasan via WhatsApp
                  </Button>
                </div>

                {/* AKSI 1-CLICK SINKRONISASI KE EKOSISTEM */}
                <div className="bg-indigo-50/70 border border-indigo-200 p-5 rounded-2xl space-y-3">
                  <h5 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Rocket size={14} className="text-indigo-600" /> Eksekusi Integrasi Terpadu
                  </h5>
                  <p className="text-[11px] text-indigo-700 leading-relaxed">
                    Terapkan hasil kurasi terverifikasi langsung ke master data terkait:
                  </p>

                  {assessment.curationDomain === 'PRODUCT_CURATION' && (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Harga E-Katalog (Rp)"
                          value={catalogPrice || ''}
                          onChange={(e) => setCatalogPrice(Number(e.target.value))}
                          className="h-8.5 text-xs bg-white"
                        />
                        <Button
                          size="sm"
                          onClick={() => syncToCatalog.mutate({ assessment, catalogPrice })}
                          disabled={syncToCatalog.isPending}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 h-8.5"
                        >
                          {syncToCatalog.isPending ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} className="mr-1" />}
                          Tayangkan ke E-Katalog
                        </Button>
                      </div>
                    </div>
                  )}

                  {assessment.curationDomain === 'ALUMNI_ASSESSMENT' && (
                    <Button
                      size="sm"
                      onClick={() => syncToAlumni.mutate(assessment)}
                      disabled={syncToAlumni.isPending}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-8.5 gap-1.5"
                    >
                      {syncToAlumni.isPending ? <Loader2 size={13} className="animate-spin" /> : <GraduationCap size={14} />}
                      Sematkan Skor & Lencana ke Profil Alumni
                    </Button>
                  )}

                  {assessment.curationDomain === 'TENANT_INCUBATION' && (
                    <Button
                      size="sm"
                      onClick={() => syncToTenant.mutate(assessment)}
                      disabled={syncToTenant.isPending}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-8.5 gap-1.5"
                    >
                      {syncToTenant.isPending ? <Loader2 size={13} className="animate-spin" /> : <Building size={14} />}
                      Sinkronkan ke Health Score Tenant
                    </Button>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: DATA INPUT FORMULIR PESERTA LENGKAP */}
          {/* ======================================================== */}
          {activeTab === 'input' && (
            <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Briefcase size={16} className="text-indigo-600" /> Detail Seluruh Isian Kuesioner Peserta
                </h4>
                <Badge variant="outline" className="text-xs">
                  {Object.keys(assessment.formData || {}).length} Variabel Tercatat
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(assessment.formData || {}).map(([key, value]) => {
                  if (value === null || value === undefined || value === '') return null;
                  const isUrl = typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
                  const isArray = Array.isArray(value);

                  return (
                    <div
                      key={key}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5"
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                      </span>
                      {isUrl ? (
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={value as string}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
                          >
                            <ExternalLink size={13} /> Buka Berkas Lampiran
                          </a>
                        </div>
                      ) : isArray ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(value as string[]).map((item, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 shadow-2xs"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {String(value)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end shrink-0">
          <Button variant="outline" onClick={onClose} className="text-xs font-bold px-6">
            Tutup
          </Button>
        </div>

      </div>
    </div>
  );
}
