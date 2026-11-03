// src/app/(admin)/manajemen-kemitraan/components/ModalAiMatch.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  TrendingUp,
  Landmark,
  Briefcase,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { PartnershipInquiry } from '@/types/partnership.types';
import { PartnershipMatchResponse } from '@/types/ai';

interface ModalAiMatchProps {
  isOpen: boolean;
  onClose: () => void;
  inquiry: PartnershipInquiry | null;
}

export default function ModalAiMatch({ isOpen, onClose, inquiry }: ModalAiMatchProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PartnershipMatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !inquiry) {
      setData(null);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    fetch('/api/ai/partnership-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agencyName: inquiry.agencyName,
        agencyType: inquiry.agencyType,
        subject: inquiry.subject,
        proposalSummary: inquiry.proposalSummary || '',
        partnershipType: inquiry.partnershipType,
        estimatedBudget: inquiry.estimatedBudget,
        targetParticipants: inquiry.targetParticipants,
      }),
    })
      .then((res) => res.json())
      .then((resJson) => {
        if (!active) return;
        if (resJson.success) {
          setData(resJson);
        } else {
          setError(resJson.error || 'Gagal memproses analisis AI.');
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Koneksi gagal.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, inquiry]);

  if (!inquiry) return null;

  const analysis = data?.analysis;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-slate-200 bg-white">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300">
              <Sparkles className="w-4 h-4" />
            </span>
            <Badge className="bg-purple-500/30 text-purple-200 border-none font-bold text-[10px]">
              Clario AI Strategic Matchmaker
            </Badge>
          </div>
          <DialogTitle className="text-lg md:text-xl font-black">
            Analisis Sinergi Kemitraan: {inquiry.agencyName}
          </DialogTitle>
          <p className="text-xs text-indigo-200/80 mt-0.5">
            Perihal: <strong className="text-white">{inquiry.subject}</strong>
          </p>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                Menganalisis keselarasan profil instansi & skema dua arah STP...
              </p>
              <p className="text-[11px] text-slate-400">
                Memadukan pilar perbankan, open project taskforce, dan lab manufaktur.
              </p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <p className="font-bold">Gagal Menganalisis</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              {/* Fit Score & Summary */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                    Partnership Strategic Fit
                  </span>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    {analysis.summaryInsight}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white border border-indigo-200 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                  <span className="text-base font-black text-indigo-700">
                    {analysis.partnershipFitScore}%
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">Cocok</span>
                </div>
              </div>

              {/* Rekomendasi Skema */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  Rekomendasi Skema Sinergi:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {analysis.recommendedSchemes.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[9px] font-bold">
                          {s.code}
                        </Badge>
                        <span className="text-[10px] font-black text-emerald-700">
                          {s.relevanceScore}% Relevan
                        </span>
                      </div>
                      <h5 className="font-black text-xs text-slate-900">{s.title}</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{s.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Program Relevan & Mitra Perbankan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" /> Program Vokasi Terkait
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                    {analysis.relevantVocationalPrograms.map((prog, i) => (
                      <li key={i}>{prog}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-indigo-600" /> Mitra Finansial Potensial
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                    {analysis.potentialFinancingPartners.map((bank, i) => (
                      <li key={i}>{bank}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Plan */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  Rencana Tindak Lanjut Tim Kemitraan:
                </span>
                <div className="space-y-1.5 text-xs text-slate-600">
                  {analysis.actionPlan.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Outcome */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-[11px] text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Target Capaian:</strong> {analysis.expectedOutcome}
                </span>
              </div>
            </div>
          ) : null}

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs font-bold"
            >
              Tutup Analisis
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

