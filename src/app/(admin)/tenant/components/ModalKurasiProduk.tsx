// Lokasi file: src/app/admin/tenant/components/ModalKurasiProduk.tsx
import React, { useState, useEffect } from 'react';
import { X, Package, ShieldCheck, Save, Loader2, Target, Sparkles, CheckCircle2 } from 'lucide-react';
import { Tenant, StartupProduct, CurationScore, AIProductInsights } from '@/types';
import { useTenantProducts } from '@/hooks/useTenants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
}

export default function ModalKurasiProduk({ isOpen, onClose, tenant }: Props) {
  const { products, updateProduct } = useTenantProducts(tenant?.id);
  
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  const [scores, setScores] = useState({
    productQuality: 0, brandingPackaging: 0, productionConsistency: 0,
    productPhoto: 0, legality: 0, marketPotential: 0, innovation: 0
  });

  const selectedProduct = products.find(p => p.id === selectedProductId);

  useEffect(() => {
    if (selectedProduct?.curation) {
      setScores({
        productQuality: selectedProduct.curation.productQuality || 0,
        brandingPackaging: selectedProduct.curation.brandingPackaging || 0,
        productionConsistency: selectedProduct.curation.productionConsistency || 0,
        productPhoto: selectedProduct.curation.productPhoto || 0,
        legality: selectedProduct.curation.legality || 0,
        marketPotential: selectedProduct.curation.marketPotential || 0,
        innovation: selectedProduct.curation.innovation || 0,
      });
    } else {
      setScores({ productQuality: 0, brandingPackaging: 0, productionConsistency: 0, productPhoto: 0, legality: 0, marketPotential: 0, innovation: 0 });
    }
  }, [selectedProductId, selectedProduct]);

  const totalScore = Math.round(
    (scores.productQuality * 0.25) + (scores.brandingPackaging * 0.20) + (scores.productionConsistency * 0.15) +
    (scores.productPhoto * 0.10) + (scores.legality * 0.10) + (scores.marketPotential * 0.10) + (scores.innovation * 0.10)
  );

  let readinessLevel = 'Pre-Incubation';
  if (totalScore >= 90) readinessLevel = 'Premium Export Ready';
  else if (totalScore >= 75) readinessLevel = 'Retail Ready';
  else if (totalScore >= 60) readinessLevel = 'Market Ready';
  else if (totalScore >= 40) readinessLevel = 'Development Needed';

  const handleScoreChange = (key: keyof typeof scores, value: number) => setScores(prev => ({ ...prev, [key]: value }));

  const handleSaveCuration = async () => {
    if (!selectedProductId) return;
    setIsSaving(true);
    const curationData: CurationScore = { ...scores, totalScore, readinessLevel: readinessLevel as any, curatedAt: Date.now(), curatedBy: 'Admin Kurator' };
    await updateProduct.mutateAsync({ productId: selectedProductId, data: { isCurated: true, curation: curationData } });
    setIsSaving(false);
    alert('Hasil kurasi berhasil disimpan!');
  };

  // FUNGSI BARU: GENERATE AI INSIGHTS
  const handleGenerateAI = async () => {
    if (!selectedProduct) return;
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/curation-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: selectedProduct.name,
          description: selectedProduct.description,
          scores, totalScore, readinessLevel
        })
      });
      
      const data = await response.json();
      if (data.success && data.insights) {
        const aiData: AIProductInsights = { ...data.insights, generatedAt: Date.now() };
        // Simpan langsung ke database produk
        await updateProduct.mutateAsync({ productId: selectedProduct.id!, data: { aiInsights: aiData } });
        alert('Insight AI berhasil digenerate & disimpan!');
      } else {
        alert('Gagal menghasilkan AI Insight: ' + data.error);
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan saat menghubungi AI.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (!isOpen || !tenant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-5xl h-[90vh] flex overflow-hidden border border-slate-100 animate-in zoom-in-95">
        
        {/* PANEL KIRI: Daftar Produk Tenant */}
        <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-6 border-b border-slate-200 bg-white">
            <h2 className="text-lg font-black text-slate-800">Kurasi Produk UKM</h2>
            <p className="text-xs font-medium text-slate-500 mt-1">Tenant: <span className="text-emerald-600 font-bold">{tenant.name}</span></p>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {products.map(product => (
              <button key={product.id} onClick={() => setSelectedProductId(product.id!)} className={`w-full text-left p-4 rounded-xl border transition-all ${selectedProductId === product.id ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                <p className={`font-bold truncate ${selectedProductId === product.id ? 'text-emerald-800' : 'text-slate-700'}`}>{product.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  {product.isCurated ? <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Skor: {product.curation?.totalScore || 0}</span> : <span className="text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-500 px-2 py-0.5 rounded">Belum Dikurasi</span>}
                  {product.aiInsights && <span title="AI Insight Tersedia" className="flex items-center"><Sparkles size={12} className="text-amber-500" /></span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* PANEL KANAN: Form Engine Kurasi */}
        <div className="flex-1 flex flex-col bg-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors z-10"><X size={20}/></button>
          
          {!selectedProduct ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Target className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-semibold text-lg">Pilih Produk untuk Dikurasi</p>
            </div>
          ) : (
            <>
              {/* Header Info Produk */}
              <div className="p-6 pb-4 border-b border-slate-100 flex gap-4">
                 <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                    {selectedProduct.images?.[0] ? <img src={selectedProduct.images[0]} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 m-4 text-slate-300" />}
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">{selectedProduct.name}</h3>
                   <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pr-10">{selectedProduct.description}</p>
                 </div>
              </div>

              {/* Engine Slider Area */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50">
                
                {/* Result & AI Card */}
                <div className="bg-slate-900 rounded-2xl p-6 text-white mb-6 shadow-xl flex items-center justify-between sticky top-0 z-10">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Curation Score™</p>
                    <div className="flex items-end gap-3">
                      <h4 className="text-5xl font-black leading-none">{totalScore}</h4>
                      <div className="pb-1"><span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${totalScore >= 75 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : totalScore >= 60 ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 'bg-amber-500/20 text-amber-400 border border-amber-500/50'}`}>{readinessLevel}</span></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={handleGenerateAI} disabled={isGeneratingAI || !selectedProduct.isCurated} className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${selectedProduct.isCurated ? 'bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/50' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`} title={!selectedProduct.isCurated ? "Simpan skor kurasi terlebih dahulu" : ""}>
                      {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} 
                      {isGeneratingAI ? 'Menganalisis...' : 'Generate AI Insights'}
                    </button>
                    {selectedProduct.aiInsights && <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12}/> Insight Tersedia</span>}
                  </div>
                </div>

                {/* TAMPILAN AI INSIGHTS JIKA ADA */}
                {selectedProduct.aiInsights && (
                   <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 animate-in slide-in-from-top-2">
                      <h4 className="text-sm font-black text-amber-800 mb-3 flex items-center gap-2"><Sparkles size={16}/> AI Curation Recommendations</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-amber-900/80">
                         <div><strong className="block text-amber-900 mb-0.5">Target Pasar:</strong> {selectedProduct.aiInsights.targetMarket}</div>
                         <div><strong className="block text-amber-900 mb-0.5">Saran Harga:</strong> {selectedProduct.aiInsights.idealPrice}</div>
                         <div><strong className="block text-amber-900 mb-0.5">Kanal Distribusi:</strong> {selectedProduct.aiInsights.distributionChannel}</div>
                         <div><strong className="block text-amber-900 mb-0.5">Perbaikan Kemasan:</strong> {selectedProduct.aiInsights.packagingImprovement}</div>
                      </div>
                   </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {[
                    { key: 'productQuality', label: 'Kualitas Produk', weight: '25%' },
                    { key: 'brandingPackaging', label: 'Branding & Kemasan', weight: '20%' },
                    { key: 'productionConsistency', label: 'Konsistensi Produksi', weight: '15%' },
                    { key: 'legality', label: 'Legalitas (PIRT/Halal/BPOM)', weight: '10%' },
                    { key: 'productPhoto', label: 'Kualitas Foto', weight: '10%' },
                    { key: 'marketPotential', label: 'Potensi Pasar', weight: '10%' },
                    { key: 'innovation', label: 'Inovasi & Diferensiasi', weight: '10%' }
                  ].map((item) => (
                    <div key={item.key} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold text-slate-700">{item.label}</label>
                        <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{item.weight}</span>
                      </div>
                      <div className="flex gap-3 items-center">
                        <input type="range" min="0" max="100" value={scores[item.key as keyof typeof scores]} onChange={(e) => handleScoreChange(item.key as keyof typeof scores, Number(e.target.value))} className="flex-1 accent-emerald-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                        <div className="w-10 h-8 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center shrink-0"><span className="text-sm font-black text-emerald-700">{scores[item.key as keyof typeof scores]}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-5 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button onClick={() => setSelectedProductId(null)} className="px-6 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Batal</button>
                <button onClick={handleSaveCuration} disabled={isSaving} className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-70 transition-all">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Skor
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}