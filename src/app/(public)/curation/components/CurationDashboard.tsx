// Lokasi file: src/app/(public)/curation/components/CurationDashboard.tsx
// Interactive Assessment Dashboard — Radar Metrics, SWOT, Risk Map, Action Plan Checklist & AI Copilot

'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Package,
  Target,
  Sparkles,
  Globe,
  Activity,
  Route,
  ListChecks,
  CheckSquare,
  Square,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Bot,
  MessageSquare,
  X,
  Send,
  Loader2,
  FileText,
} from 'lucide-react';
import { AIResult, ActionItem } from '@/types/curation.types';
import CurationPdfExport from './CurationPdfExport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Props {
  trackType: string;
  formData: any;
  aiResult: AIResult;
  onSubmit: () => void;
  onRestart: () => void;
}

export default function CurationDashboard({ trackType, formData, aiResult, onSubmit, onRestart }: Props) {
  const totalScore = aiResult.totalScore || 0;
  const isHighTier = totalScore >= 75;

  // State Checklist Action Plan Interaktif
  const initialActionPlan: ActionItem[] =
    aiResult.customActionPlan && aiResult.customActionPlan.length > 0
      ? aiResult.customActionPlan
      : (aiResult.nextActionSteps || []).map((step, idx) => ({
          id: `act-${idx}`,
          task: step.task,
          description: `Target penyelesaian: ${step.timeframe}`,
          timeframe: step.timeframe,
          isCompleted: false,
        }));

  const [actionItems, setActionItems] = useState<ActionItem[]>(initialActionPlan);

  const toggleActionItem = (id: string) => {
    setActionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isCompleted: !item.isCompleted } : item))
    );
  };

  // State Curation AI Copilot Floating Sheet
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<Array<{ role: 'assistant' | 'user'; content: string }>>([
    {
      role: 'assistant',
      content: `Halo! Saya Curation Copilot Solo Technopark. Saya telah menganalisis hasil asesmen "${formData.namaUsaha || formData.namaProduk || 'Anda'}" dengan skor ${totalScore}/100 (${aiResult.readinessLevel}). Ada strategi atau langkah perbaikan yang ingin didiskusikan?`,
    },
  ]);

  const handleSendCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotInput.trim() || isCopilotLoading) return;

    const userText = copilotInput.trim();
    setCopilotInput('');
    setCopilotMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setIsCopilotLoading(true);

    try {
      const res = await fetch('/api/curation-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copilot-chat',
          userMessage: userText,
          assessmentContext: {
            subjekName: formData.namaUsaha || formData.namaProduk || 'Peserta',
            score: totalScore,
            readinessLevel: aiResult.readinessLevel,
            aiResult,
          },
          history: copilotMessages,
        }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setCopilotMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        toast.error('Gagal mendapatkan respon Copilot.');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setIsCopilotLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-slate-50 relative overflow-hidden animate-in fade-in duration-700 min-h-[calc(100vh-5.5rem)] py-12 px-6 lg:px-16 xl:px-24">
      <div className="w-full max-w-7xl mx-auto relative z-10 space-y-8">
        
        {/* HEADER TOP ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-200">
              Hasil Asesmen AI Terverifikasi
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mt-1.5">
              {formData.namaUsaha || formData.namaProduk || 'Laporan Asesmen'}
            </h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
              Program: {trackType} • Tanggal: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onRestart}
              className="text-xs font-bold rounded-full h-10 px-5 shadow-xs cursor-pointer"
            >
              Mulai Asesmen Baru
            </Button>
            <Button
              onClick={() => setIsCopilotOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-full h-10 px-5 shadow-md gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} /> Tanya AI Copilot
            </Button>
          </div>
        </div>

        {/* HERO SCORE BANNER */}
        <div
          className={`rounded-3xl p-8 sm:p-12 text-white shadow-2xl flex flex-col md:flex-row justify-between md:items-center relative overflow-hidden ${
            isHighTier
              ? 'bg-gradient-to-br from-emerald-600 to-teal-800'
              : 'bg-gradient-to-br from-indigo-600 to-blue-800'
          }`}
        >
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-white/80 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck size={18} /> Curation Readiness Score™
              </span>
              <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/30">
                Confidence: {aiResult.dataConfidenceScore || 85}%
              </span>
            </div>

            <div className="flex items-end gap-6">
              <span className="text-7xl sm:text-8xl lg:text-9xl font-black leading-none tracking-tighter">
                {totalScore}
              </span>
              <div className="pb-3 space-y-1">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/30 block w-fit">
                  {aiResult.readinessLevel || 'Siap Pengembangan'}
                </span>
                <span className="text-white/80 text-xs font-medium block">
                  Rute Rekomendasi: <strong>{aiResult.incubationRoute}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* EXECUTIVE SUMMARY */}
        {aiResult.executiveSummary && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Ringkasan Eksekutif Analis</h3>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">{aiResult.executiveSummary}</p>
          </div>
        )}

        {/* RADAR BREAKDOWN METRICS */}
        {aiResult.metrics && aiResult.metrics.length > 0 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <Activity size={16} /> Skor Pilar Penilaian
              </h3>
              <span className="text-xs font-bold text-slate-400">{aiResult.metrics.length} Dimensi Terukur</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiResult.metrics.map((m, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{m.label}</span>
                    <span className="font-black text-indigo-700">{m.score}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${m.score}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{m.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BENTO GRID: SWOT ANALYSIS (4 KUADRAN) */}
        {aiResult.swotAnalysis && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Strengths */}
            <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-3xl space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Target size={15} /> Strengths (Kekuatan)
              </span>
              <ul className="space-y-2 text-xs text-emerald-950 font-medium">
                {aiResult.swotAnalysis.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">●</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="p-6 bg-amber-50/70 border border-amber-200 rounded-3xl space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <AlertTriangle size={15} /> Weaknesses (Kelemahan)
              </span>
              <ul className="space-y-2 text-xs text-amber-950 font-medium">
                {aiResult.swotAnalysis.weaknesses.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">●</span> {w}
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="p-6 bg-blue-50/70 border border-blue-200 rounded-3xl space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                <TrendingUp size={15} /> Opportunities (Peluang)
              </span>
              <ul className="space-y-2 text-xs text-blue-950 font-medium">
                {aiResult.swotAnalysis.opportunities.map((o, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">●</span> {o}
                  </li>
                ))}
              </ul>
            </div>

            {/* Threats */}
            <div className="p-6 bg-rose-50/70 border border-rose-200 rounded-3xl space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <ShieldCheck size={15} /> Threats (Ancaman)
              </span>
              <ul className="space-y-2 text-xs text-rose-950 font-medium">
                {aiResult.swotAnalysis.threats.map((t, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-rose-500 mt-0.5">●</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* REKOMENDASI STRATEGIS & ACTION PLAN CHECKLIST */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Rekomendasi AI (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-600" /> Rekomendasi Strategis Langkah Lanjutan
            </h3>
            <div className="space-y-4">
              {Array.isArray(aiResult.recommendations) && aiResult.recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                  <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider">{rec.title}</h4>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">{rec.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Action Plan (5 Cols) */}
          <div className="lg:col-span-5 bg-indigo-50/60 p-6 sm:p-8 rounded-3xl border border-indigo-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950 flex items-center gap-2">
                <ListChecks size={16} className="text-indigo-600" /> Action Plan Checklist
              </h3>
              <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                {actionItems.filter((i) => i.isCompleted).length} / {actionItems.length} Selesai
              </span>
            </div>

            <div className="space-y-3">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleActionItem(item.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    item.isCompleted
                      ? 'bg-emerald-50/80 border-emerald-300 text-slate-400 line-through'
                      : 'bg-white border-indigo-100 text-slate-800 hover:border-indigo-300 shadow-xs'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {item.isCompleted ? (
                      <CheckSquare size={16} className="text-emerald-600" />
                    ) : (
                      <Square size={16} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs leading-tight block">{item.task}</span>
                    {item.timeframe && (
                      <span className="text-[10px] text-indigo-600 font-semibold block mt-1">
                        Timeline: {item.timeframe}
                      </span>
                    )}
                    {item.contextualTip && (
                      <p className="text-[10px] text-slate-500 mt-1 italic leading-relaxed">
                        Tip: {item.contextualTip}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* BOTTOM ACTION & PDF EXPORT */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs justify-between">
          <div className="w-full sm:w-auto">
            <CurationPdfExport trackType={trackType} formData={formData} aiResult={aiResult} />
          </div>
          <Button
            size="lg"
            onClick={onSubmit}
            className="w-full sm:w-auto px-8 py-5 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-2xl text-sm shadow-xl gap-2 cursor-pointer transition-all"
          >
            Kirim Hasil ke Database Inkubator Nasional <ArrowRight size={16} />
          </Button>
        </div>

      </div>

      {/* FLOATING CURATION AI COPILOT CHAT MODAL / DRAWER */}
      {isCopilotOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md h-[80vh] sm:h-[650px] flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h4 className="font-black text-sm">Curation AI Copilot</h4>
                  <span className="text-[10px] text-indigo-100 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Context-Aware Assistant
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCopilotOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-xs bg-slate-50/50">
              {copilotMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-xs font-medium'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isCopilotLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl text-slate-400 text-xs flex items-center gap-2">
                    <Loader2 size={13} className="animate-spin" /> Merumuskan saran taktis...
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendCopilot} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
              <Input
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                placeholder="Tanyakan langkah perbaikan..."
                className="text-xs bg-slate-50 border-slate-200 rounded-xl h-10"
              />
              <Button
                type="submit"
                disabled={isCopilotLoading || !copilotInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-4 rounded-xl shrink-0"
              >
                <Send size={14} />
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
