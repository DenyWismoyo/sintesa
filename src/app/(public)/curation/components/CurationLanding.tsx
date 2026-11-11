// Lokasi file: src/app/(public)/curation/components/CurationLanding.tsx
// Landing Page Curation & Assessment — Micro-Simulator + Token Batch Access

'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  History,
  Clock,
  Activity,
  ChevronRight,
  Sparkles,
  Key,
  Target,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Props {
  onStart: () => void;
  onLoadHistory: (historyItem: any) => void;
  onUseToken?: (tokenCode: string) => void;
}

export default function CurationLanding({ onStart, onLoadHistory, onUseToken }: Props) {
  const [history, setHistory] = useState<any[]>([]);

  // Micro-Simulator state
  const [microIdea, setMicroIdea] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [microResult, setMicroResult] = useState<{ kekuatan: string; kelemahan: string; skor: number } | null>(null);

  // Token state
  const [inputToken, setInputToken] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('curation_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Gagal memuat riwayat', e);
    }
  }, []);

  const handleRunMicroSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (microIdea.trim().length < 5) {
      toast.error('Ketik deskripsi produk/keahlian minimal 5 karakter.');
      return;
    }

    setIsSimulating(true);
    setMicroResult(null);
    try {
      const res = await fetch('/api/curation-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'micro-simulate',
          idea: microIdea.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMicroResult(data.data);
        toast.success('Analisis awal 3 detik selesai!');
      } else {
        toast.error('Gagal memproses simulasi.');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplyToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) {
      toast.error('Masukkan kode token asesmen.');
      return;
    }
    onUseToken?.(inputToken.trim().toUpperCase());
  };

  return (
    <div className="w-full min-h-[calc(100vh-5.5rem)] flex items-center relative overflow-hidden bg-slate-50 py-12">
      {/* Ambient Ornaments */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-emerald-200/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-16 xl:px-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative z-10">
        
        {/* KIRI: Hero Section (60%) */}
        <div className="w-full lg:w-3/5 text-center lg:text-left space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">
          
          <div className="w-16 h-16 lg:mx-0 mx-auto rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xl flex items-center justify-center border-4 border-white">
            <ShieldCheck size={32} />
          </div>

          <div className="space-y-3">
            <span className="inline-block text-[11px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
              Solo Technopark • Universal Curation &amp; Assessment Engine
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Smart Curation &amp;<br />
              <span className="text-indigo-600">Competency Assessment</span>
            </h1>
            <p className="text-base text-slate-500 leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0">
              Platform evaluasi kecerdasan buatan terpadu untuk <strong>Kurasi Produk E-Katalog</strong>, <strong>Asesmen Kesiapan Kerja Alumni Pelatihan</strong>, seleksi <strong>Tenant Inkubator</strong>, dan penjurian <strong>Inovasi Krenova</strong>.
            </p>
          </div>

          {/* ACTION BUTTONS & TOKEN INPUT */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-2">
            <Button
              size="lg"
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-6 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-2xl text-base shadow-xl gap-2 cursor-pointer transition-all"
            >
              Mulai Asesmen Mandiri <ArrowRight size={18} />
            </Button>

            {/* Input Token Batch */}
            <form onSubmit={handleApplyToken} className="w-full sm:w-auto flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Key size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value.toUpperCase())}
                  placeholder="Kode Token Batch (Opsional)"
                  className="pl-9 h-12 text-xs font-mono font-bold bg-white rounded-2xl border-slate-200"
                />
              </div>
              <Button type="submit" variant="outline" className="h-12 px-4 rounded-2xl text-xs font-bold shrink-0">
                Gunakan Token
              </Button>
            </form>
          </div>

          {/* MICRO-SIMULATOR WIDGET (3 DETIK BEDAH IDE) */}
          <div className="bg-white/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-md text-left space-y-4 max-w-2xl mx-auto lg:mx-0">
            <div className="flex items-center gap-2 text-indigo-700">
              <Sparkles size={16} />
              <h4 className="text-xs font-black uppercase tracking-wider">
                Micro-Simulator AI: Bedah Produk / Keahlian Anda dalam 3 Detik
              </h4>
            </div>

            <form onSubmit={handleRunMicroSimulate} className="flex gap-2">
              <Input
                value={microIdea}
                onChange={(e) => setMicroIdea(e.target.value)}
                placeholder="Misal: Sambal roa kemasan pouch sablon izin PIRT atau Welder 3G siap kerja..."
                className="text-xs bg-slate-50 border-slate-200 rounded-xl h-10"
              />
              <Button
                type="submit"
                disabled={isSimulating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-10 px-4 rounded-xl shrink-0"
              >
                {isSimulating ? <Loader2 size={14} className="animate-spin" /> : 'Bedah Cepat'}
              </Button>
            </form>

            {microResult && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs animate-in slide-in-from-top-2">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-700">
                    <Target size={14} /> Kekuatan Utama:
                  </div>
                  <p className="text-[11px] leading-relaxed">{microResult.kekuatan}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-700">
                    <AlertTriangle size={14} /> Blind Spot / Tantangan:
                  </div>
                  <p className="text-[11px] leading-relaxed">{microResult.kelemahan}</p>
                </div>
                <div className="sm:col-span-2 flex items-center justify-between bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100 text-[11px]">
                  <span className="font-semibold text-indigo-900">Estimasi Skor Awal: <strong>{microResult.skor}/100</strong></span>
                  <button onClick={onStart} className="font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer">
                    Ikuti Asesmen Penuh <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* KANAN: Riwayat Kurasi Panel (40%) */}
        {history.length > 0 && (
          <div className="w-full lg:w-2/5 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 w-full max-w-md mx-auto lg:ml-auto">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <History size={16} className="text-indigo-600" /> Riwayat Asesmen Lokal
              </h3>
              
              <div className="space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onLoadHistory(item)}
                    className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all group"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {item.trackType}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={11} /> {new Date(item.date).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">
                      {item.namaUsaha}
                    </h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 text-xs">
                      <span className="font-bold text-emerald-600 text-[11px]">Skor: {item.score}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{item.readinessLevel || 'Selesai'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
