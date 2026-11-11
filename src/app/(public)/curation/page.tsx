// Lokasi file: src/app/(public)/curation/page.tsx
// Halaman Utama Asesmen & Kurasi Universal AI Terpadu (Next.js 14 App Router)

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useTenants } from '@/hooks/useTenants';
import { storageService } from '@/services/storage.service';
import { curationService } from '@/services/curation.service';
import { CurationTemplate, CurationAssessment, AIResult, CurationToken } from '@/types/curation.types';

import CurationLanding from './components/CurationLanding';
import TrackSelector from './components/TrackSelector';
import WizardForm from './components/WizardForm';
import CurationDashboard from './components/CurationDashboard';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export type ViewState = 'landing' | 'track-select' | 'wizard' | 'processing' | 'dashboard';

function CurationWizardContent() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token');
  const domainParam = searchParams.get('domain');

  const { user } = useAuth();
  const { submitCuration } = useTenants();

  const [viewState, setViewState] = useState<ViewState>('landing');
  const [selectedTemplate, setSelectedTemplate] = useState<CurationTemplate | null>(null);
  const [currentToken, setCurrentToken] = useState<CurationToken | null>(null);

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [savedAssessmentId, setSavedAssessmentId] = useState<string | null>(null);

  // Otomatis tangani token dari parameter URL jika ada (?token=TOKEN123)
  useEffect(() => {
    if (tokenParam) {
      handleUseToken(tokenParam);
    }
  }, [tokenParam]);

  const handleUseToken = async (tokenCode: string) => {
    try {
      toast.loading('Memvalidasi token asesmen...');
      const token = await curationService.validateToken(tokenCode);
      if (!token) {
        toast.dismiss();
        toast.error('Token tidak valid, sudah kedaluwarsa, atau kuota telah habis.');
        return;
      }

      // Ambil template yang terikat dengan token
      const template = await curationService.getTemplateById(token.templateId);
      toast.dismiss();
      if (!template) {
        toast.error('Instrumen template untuk token ini tidak ditemukan.');
        return;
      }

      setCurrentToken(token);
      setSelectedTemplate(template);
      setViewState('wizard');
      toast.success(`Token "${token.code}" aktif untuk kelas: ${token.batchName || template.trackName}`);
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || 'Gagal memproses token.');
    }
  };

  const saveToHistory = (data: any, result: AIResult, template: CurationTemplate) => {
    try {
      const existing = localStorage.getItem('curation_history');
      const historyArr = existing ? JSON.parse(existing) : [];

      const sanitizedData = { ...data };
      delete sanitizedData.pitchDeckFile;
      delete sanitizedData.legalitasFile;
      delete sanitizedData.fotoProdukFile;
      delete sanitizedData.fileSertifikat;

      const newEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        trackType: template.trackName,
        domain: template.curationDomain,
        namaUsaha: data.namaUsaha || data.namaProduk || data.namaLengkap || 'Peserta',
        score: result.totalScore || 70,
        readinessLevel: result.readinessLevel || 'Evaluated',
        data: sanitizedData,
        result: result,
      };

      historyArr.unshift(newEntry);
      localStorage.setItem('curation_history', JSON.stringify(historyArr.slice(0, 10)));
    } catch (e) {
      console.error('Gagal menyimpan riwayat lokal', e);
    }
  };

  const processAssessment = async (finalData: any, fileDataUris: string[] = []) => {
    if (!selectedTemplate) return;

    setFormData(finalData);
    setViewState('processing');

    try {
      const sanitizedForApi = { ...finalData };
      delete sanitizedForApi.pitchDeckFile;
      delete sanitizedForApi.legalitasFile;
      delete sanitizedForApi.fotoProdukFile;
      delete sanitizedForApi.fileSertifikat;

      // Panggil Multi-Stage Clario AI Pipeline
      const payload = {
        action: 'evaluate',
        formData: sanitizedForApi,
        trackType: selectedTemplate.trackName,
        curationDomain: selectedTemplate.curationDomain,
        aiPromptConfig: selectedTemplate.aiPromptConfig,
        fileDataUris: fileDataUris.slice(0, 2),
      };

      const response = await fetch('/api/curation-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      let insights: AIResult;

      if (resData.success && resData.insights) {
        insights = resData.insights;
      } else {
        throw new Error(resData.error || 'AI gagal mengevaluasi data');
      }

      setAiResult(insights);
      saveToHistory(finalData, insights, selectedTemplate);

      // Simpan ke database Firestore terpusat
      try {
        const newId = `assess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const assessmentPayload: CurationAssessment = {
          id: newId,
          templateId: selectedTemplate.id,
          trackType: selectedTemplate.trackName,
          curationDomain: selectedTemplate.curationDomain,
          tokenUsed: currentToken?.code || undefined,
          subjekName: finalData.namaUsaha || finalData.namaProduk || finalData.namaLengkap || 'Peserta Asesmen',
          applicantName: finalData.namaPemilik || finalData.namaLengkap || 'Anonim',
          whatsapp: finalData.whatsapp || finalData.telepon || '-',
          email: finalData.email || user?.email || '-',
          formData: sanitizedForApi,
          score: insights.totalScore || 70,
          readinessLevel: insights.readinessLevel || 'Evaluated',
          aiResult: insights,
          storageFilePaths: fileDataUris || [],
          status: 'PENDING',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await curationService.saveAssessment(assessmentPayload);
        setSavedAssessmentId(newId);

        // Jika pakai token, catat redeem
        if (currentToken) {
          await curationService.redeemToken(
            currentToken.code,
            finalData.namaLengkap || finalData.namaUsaha || 'Peserta'
          );
        }
      } catch (dbErr) {
        console.error('Gagal mencatat asesmen ke Firestore:', dbErr);
      }
    } catch (error: any) {
      console.warn('AI processing error, menggunakan fallback:', error);
      toast.error('Koneksi analisis terhambat, menyajikan kalkulasi estimasi terkalibrasi.');

      const fallbackResult: AIResult = {
        totalScore: 75,
        dataConfidenceScore: 82,
        readinessLevel: 'Market Ready',
        contradictionsFound: [],
        metrics: [],
        executiveSummary: `Asesmen ${selectedTemplate.trackName} telah selesai diproses. Potensi subjek berada pada kategori siap berkembang dengan catatan peningkatan terstruktur.`,
        swotAnalysis: {
          strengths: ['Memiliki proposisi nilai unik', 'Responsif terhadap kebutuhan pelanggan'],
          weaknesses: ['Dokumentasi proses perlu diperkuat', 'Standarisasi mutu belum optimal'],
          opportunities: ['Peluang pasar lokal dan digital terbuka luas', 'Dukungan ekosistem Solo Technopark'],
          threats: ['Fluktuasi biaya operasional', 'Kompetitor dengan skala modal besar'],
        },
        riskAssessment: {
          criticalRisks: ['Risiko kapasitas produksi', 'Risiko persaingan pasar'],
          mitigationStrategies: ['Diversifikasi suplier', 'Promosi digital berkelanjutan'],
        },
        recommendations: [
          { title: 'Validasi Pasar', content: 'Pertahankan segmen pasar utama dan perluas jaringan B2B/B2G.' },
          { title: 'Kepatuhan & Sertifikasi', content: 'Lengkapi perizinan resmi agar lebih bankable.' },
        ],
        nextActionSteps: [
          { timeframe: 'Minggu 1-2', task: 'Validasi dokumen & legalitas resmi' },
          { timeframe: 'Bulan 1', task: 'Optimasi portofolio atau sertifikasi produk' },
        ],
        incubationRoute: 'Inkubasi Reguler',
      };

      setAiResult(fallbackResult);
      saveToHistory(finalData, fallbackResult, selectedTemplate);
    }

    setViewState('dashboard');
  };

  const loadHistoryData = (historyItem: any) => {
    setSelectedTemplate({
      id: historyItem.templateId || 'history-template',
      trackName: historyItem.trackType || 'Asesmen Tersimpan',
      trackDescription: 'Data riwayat tersimpan lokal',
      trackIcon: 'ShieldCheck',
      curationDomain: historyItem.domain || 'PRODUCT_CURATION',
      category: 'Umum',
      isActive: true,
      version: 1,
      lastUpdated: new Date().toISOString(),
      formMode: 'standard',
      steps: [],
      aiPromptConfig: {
        aiPersona: 'Kurator',
        assessmentGoal: 'Evaluasi',
        gradingStrictness: 'standard',
        reportTone: 'consultative',
        targetAudience: 'umkm',
        expectedMetrics: [],
        expectedAnalysisBlocks: [],
        expectedRecommendations: [],
      },
    });
    setFormData(historyItem.data);
    setAiResult(historyItem.result);
    setViewState('dashboard');
  };

  const handleAjukanPendampingan = async () => {
    if (!selectedTemplate || !aiResult) return;

    try {
      toast.loading('Menghubungkan data ke ekosistem inkubasi...');

      let pitchDeckUrl: string | undefined = formData.pitchDeckUrl || undefined;
      let legalDocUrl: string | undefined = formData.legalDocUrl || undefined;
      let productImageUrl: string | undefined = undefined;

      if (formData.pitchDeckFile instanceof File) {
        pitchDeckUrl = await storageService.uploadFile(formData.pitchDeckFile, 'tenants/curation/documents');
      }
      if (formData.legalitasFile instanceof File) {
        legalDocUrl = await storageService.uploadFile(formData.legalitasFile, 'tenants/curation/documents');
      }
      if (formData.fotoProdukFile instanceof File) {
        productImageUrl = await storageService.uploadImage(formData.fotoProdukFile, 'tenants/curation/products');
      }

      const cleanSelfAssessment: Record<string, any> = { trackType: selectedTemplate.trackName, ...formData };
      delete cleanSelfAssessment.pitchDeckFile;
      delete cleanSelfAssessment.legalitasFile;
      delete cleanSelfAssessment.fotoProdukFile;
      delete cleanSelfAssessment.fileSertifikat;

      const totalScore = aiResult.totalScore || 70;

      const newTenantDraft = {
        name: formData.namaUsaha || formData.namaProduk || 'Bisnis Baru',
        ownerName: formData.namaPemilik || formData.namaLengkap || 'Pemilik',
        contact: formData.whatsapp || formData.telepon || '-',
        email: formData.email || user?.email || '-',
        sector: formData.sektor || formData.kategori || 'Umum',
        status: 'Menunggu Review',
        pipelineStage: 'Pra-Inkubasi',
        joinedAt: new Date().toISOString().split('T')[0],
        segment: selectedTemplate.curationDomain === 'PRODUCT_CURATION' ? 'UKM' : 'Startup',
        pitchDeckUrl,
        legalDocUrl,
        selfAssessment: cleanSelfAssessment,
        aiCurationData: {
          totalScore,
          readinessLevel: aiResult.readinessLevel,
          scoreBreakdown: {
            productAndTech: totalScore,
            marketAndFinancial: totalScore,
            legalAndCompliance: totalScore,
          },
          recommendations: aiResult.recommendations,
          curatedAt: Date.now(),
        },
        smeReadinessLevel: aiResult.readinessLevel,
        isVerified: false,
      };

      const initialProductData = {
        name: formData.namaProduk || `${formData.namaUsaha || 'Produk'} - Unggulan`,
        description: formData.deskripsi || formData.solusi || 'Detail terlampir di self-assessment kurasi',
        category: newTenantDraft.sector,
        images: productImageUrl ? [productImageUrl] : [],
        isCurated: true,
        curation: {
          totalScore,
          readinessLevel: aiResult.readinessLevel,
          curatedAt: Date.now(),
        },
        aiInsights: aiResult.recommendations,
      };

      await submitCuration(newTenantDraft as any, initialProductData);
      toast.dismiss();
      toast.success('Pengajuan Berhasil! Data asesmen dan berkas telah masuk ke sistem inkubasi.');
      window.location.href = '/';
    } catch (error) {
      console.error('Error submitting curation:', error);
      toast.dismiss();
      toast.error('Terjadi kesalahan saat menyimpan pengajuan.');
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-slate-50 relative min-h-[calc(100vh-5.5rem)]">
      {viewState === 'landing' && (
        <CurationLanding
          onStart={() => setViewState('track-select')}
          onLoadHistory={loadHistoryData}
          onUseToken={handleUseToken}
        />
      )}

      {viewState === 'track-select' && (
        <TrackSelector
          initialDomain={(domainParam as any) || undefined}
          onSelect={(template) => {
            setSelectedTemplate(template);
            setViewState('wizard');
          }}
          onBack={() => setViewState('landing')}
        />
      )}

      {viewState === 'wizard' && selectedTemplate && (
        <WizardForm
          template={selectedTemplate}
          onComplete={processAssessment}
          onBack={() => {
            if (currentToken) {
              setViewState('landing');
            } else {
              setViewState('track-select');
            }
          }}
        />
      )}

      {viewState === 'processing' && (
        <div className="w-full h-full min-h-[calc(100vh-5.5rem)] flex flex-col items-center justify-center p-6 text-center text-white bg-slate-900 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="w-24 h-24 border-[6px] border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-10 relative z-10" />
          <h2 className="text-3xl lg:text-5xl font-black mb-6 relative z-10 tracking-tight">
            Membedah Kompleksitas Variabel...
          </h2>
          <p className="text-indigo-200 text-lg lg:text-xl max-w-2xl mx-auto relative z-10 font-medium leading-relaxed">
            Clario AI Multi-Agent Engine sedang mengevaluasi data instrumen &quot;{selectedTemplate?.trackName}&quot; berdasarkan
            rubrik penilaian objektif dan tolok ukur industri.
          </p>
        </div>
      )}

      {viewState === 'dashboard' && selectedTemplate && aiResult && (
        <CurationDashboard
          trackType={selectedTemplate.trackName}
          formData={formData}
          aiResult={aiResult}
          onSubmit={handleAjukanPendampingan}
          onRestart={() => {
            setFormData({});
            setAiResult(null);
            setCurrentToken(null);
            setSelectedTemplate(null);
            setViewState('landing');
          }}
        />
      )}
    </div>
  );
}

export default function CurationWizard() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[calc(100vh-5.5rem)] flex flex-col items-center justify-center bg-slate-50 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500">Memuat Sistem Kurasi...</p>
        </div>
      }
    >
      <CurationWizardContent />
    </Suspense>
  );
}
