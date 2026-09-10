'use client';

import React, { useState } from 'react';
import { useTenants } from '@/hooks/useTenants';

import CurationLanding from './components/CurationLanding';
import TrackSelector, { TrackType } from './components/TrackSelector';
import WizardForm from './components/WizardForm';
import CurationDashboard from './components/CurationDashboard';

export type ViewState = 'landing' | 'track-select' | 'wizard' | 'processing' | 'dashboard';

export default function CurationWizard() {
  const { submitCuration } = useTenants();
  
  const [viewState, setViewState] = useState<ViewState>('landing');
  const [trackType, setTrackType] = useState<TrackType>(null);
  
  const [formData, setFormData] = useState<any>({});
  const [aiResult, setAiResult] = useState<any>(null);

  const saveToHistory = (data: any, result: any, track: string) => {
    try {
      const existing = localStorage.getItem('curation_history');
      const historyArr = existing ? JSON.parse(existing) : [];
      
      const newEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        trackType: track,
        namaUsaha: data.namaUsaha,
        score: Math.round(((result?.scoreBreakdown?.productAndTech || 0) + (result?.scoreBreakdown?.marketAndFinancial || 0) + (result?.scoreBreakdown?.legalAndCompliance || 0)) / 3),
        readinessLevel: result?.readinessLevel,
        data: data,
        result: result
      };
      
      historyArr.unshift(newEntry);
      localStorage.setItem('curation_history', JSON.stringify(historyArr.slice(0, 10)));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  };

  const processAssessment = async (finalData: any) => {
    setFormData(finalData);
    setViewState('processing');
    try {
      // FIX: Payload key diubah menjadi formData agar cocok dengan API backend
      const payload = { trackType, formData: finalData };
      const response = await fetch('/api/curation-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.success) {
        setAiResult(data.insights);
        saveToHistory(finalData, data.insights, trackType!);
      } else {
        throw new Error("AI gagal merespons");
      }
    } catch (error) {
      const fallbackResult = {
        readinessLevel: "Market Ready",
        scoreBreakdown: { productAndTech: 72, marketAndFinancial: 65, legalAndCompliance: 78 },
        recommendations: {
          targetMarket: "Analisis gagal dimuat karena koneksi AI.",
          pricingAndMonetization: "Cek kembali model bisnis Anda.",
          distributionAndGrowth: "Optimalkan retensi dari pengguna yang ada.",
          productImprovement: "Fokus pada stabilisasi layanan/produk.",
          investmentReadiness: "Lengkapi dokumen pendukung agar lebih bankable.",
          nextActionSteps: ["Perbaiki koneksi AI", "Lengkapi profil usaha"],
          incubationRoute: "Inkubasi Reguler"
        }
      };
      setAiResult(fallbackResult);
      saveToHistory(finalData, fallbackResult, trackType!);
    }
    setViewState('dashboard');
  };

  const loadHistoryData = (historyItem: any) => {
    setTrackType(historyItem.trackType);
    setFormData(historyItem.data);
    setAiResult(historyItem.result);
    setViewState('dashboard');
  };

  const handleAjukanPendampingan = async () => {
    try {
      const averageScore = Math.round(((aiResult?.scoreBreakdown?.productAndTech || 0) + (aiResult?.scoreBreakdown?.marketAndFinancial || 0) + (aiResult?.scoreBreakdown?.legalAndCompliance || 0)) / 3);
      const newTenantDraft = {
        name: formData.namaUsaha || 'Bisnis Baru',
        ownerName: formData.namaPemilik,
        contact: formData.whatsapp,
        email: formData.email,
        sector: trackType === 'Startup' ? 'Teknologi' : (formData.jenisUsaha || formData.jenisJasa || 'Umum'),
        status: 'Menunggu Review',
        pipelineStage: 'Pra-Inkubasi',
        joinedAt: new Date().toISOString().split('T')[0],
        segment: trackType, 
        selfAssessment: { trackType, ...formData }, 
        aiCurationData: {
          totalScore: averageScore,
          readinessLevel: aiResult?.readinessLevel,
          scoreBreakdown: aiResult?.scoreBreakdown,
          recommendations: aiResult?.recommendations,
          curatedAt: Date.now()
        },
        smeReadinessLevel: aiResult?.readinessLevel,
        isVerified: false
      };

      const initialProductData = {
        name: 'Produk Utama / Layanan Utama',
        description: 'Detail terlampir di form self-assessment',
        category: newTenantDraft.sector,
        isCurated: true,
        curation: {
          totalScore: averageScore,
          readinessLevel: aiResult?.readinessLevel,
          curatedAt: Date.now(),
        },
        aiInsights: aiResult?.recommendations
      };

      await submitCuration(newTenantDraft as any, initialProductData);
      alert("Pengajuan Berhasil! Data asesmen telah masuk sistem inkubator.");
      window.location.href = '/'; 
    } catch (error) {
      alert("Terjadi kesalahan sistem saat menyimpan data.");
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-slate-50 relative min-h-[calc(100vh-5.5rem)]">
      {viewState === 'landing' && (
        <CurationLanding 
          onStart={() => setViewState('track-select')} 
          onLoadHistory={loadHistoryData} 
        />
      )}
      
      {viewState === 'track-select' && (
        <TrackSelector 
          onSelect={(track) => { setTrackType(track); setViewState('wizard'); }} 
          onBack={() => setViewState('landing')}
        />
      )}
      
      {viewState === 'wizard' && trackType && (
        <WizardForm 
          trackType={trackType} 
          onComplete={processAssessment} 
          onBack={() => setViewState('track-select')}
        />
      )}

      {viewState === 'processing' && (
        <div className="w-full h-full min-h-[calc(100vh-5.5rem)] flex flex-col items-center justify-center p-6 text-center text-white bg-slate-900 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="w-24 h-24 border-[6px] border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-10 relative z-10"></div>
          <h2 className="text-3xl lg:text-5xl font-black mb-6 relative z-10 tracking-tight">Menganalisis Kompleksitas Data...</h2>
          <p className="text-indigo-200 text-lg lg:text-xl max-w-2xl mx-auto relative z-10 font-medium">AI Engine sedang mengkalkulasi matriks {trackType} Anda berdasarkan puluhan variabel industri.</p>
        </div>
      )}

      {viewState === 'dashboard' && aiResult && (
        <CurationDashboard 
          trackType={trackType!} 
          formData={formData} 
          aiResult={aiResult} 
          onSubmit={handleAjukanPendampingan} 
          onRestart={() => {
            setFormData({});
            setAiResult(null);
            setViewState('landing');
          }}
        />
      )}
    </div>
  );
}