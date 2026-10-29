import React, { useState, useEffect } from 'react';
import { X, Package, Save, Loader2, Target, Sparkles, CheckCircle2, Rocket } from 'lucide-react';
import { Tenant, CurationScore, AIProductInsights } from '@/types';
import { useTenantProducts } from '@/hooks/useTenants';
import { tenantService } from '@/services/tenant.service';
import { catalogService } from '@/services/catalog.service';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
}

export default function ModalKurasiProduk({ isOpen, onClose, tenant }: Props) {
  const { products, updateProduct } = useTenantProducts(tenant?.id);
  const queryClient = useQueryClient();
  
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [catalogPrice, setCatalogPrice] = useState<number>(0);
  
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
    if (!selectedProductId || !tenant?.id) return;
    setIsSaving(true);
    try {
      const curationData: CurationScore = { ...scores, totalScore, readinessLevel: readinessLevel as any, curatedAt: Date.now(), curatedBy: 'Admin Kurator' };
      await updateProduct.mutateAsync({ productId: selectedProductId, data: { isCurated: true, curation: curationData } });
      // Sinkronkan smeReadinessLevel ke dokumen induk Tenant agar tampil di kartu & tabel
      await tenantService.updateTenant(tenant.id, { smeReadinessLevel: readinessLevel as any });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success(`Hasil kurasi disimpan! Level kesiapan: ${readinessLevel}`);
    } catch (err: any) {
      toast.error('Gagal menyimpan kurasi: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePromoteToCatalog = async () => {
    if (!selectedProduct || !tenant) return;
    setIsPromoting(true);
    try {
      const res = await catalogService.promoteTenantProductToCatalog(
        tenant,
        {
          ...selectedProduct,
          isCurated: true,
          curation: { ...scores, totalScore, readinessLevel: readinessLevel as any, curatedAt: Date.now(), curatedBy: 'Admin Kurator' }
        },
        catalogPrice
      );
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      toast.success(
        res.updated
          ? `Produk "${selectedProduct.name}" berhasil diperbarui di Master E-Katalog!`
          : `Produk "${selectedProduct.name}" resmi ditayangkan ke Master E-Katalog Publik!`
      );
    } catch (err: any) {
      toast.error('Gagal mempromosikan ke E-Katalog: ' + err.message);
    } finally {
      setIsPromoting(false);
    }
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
        await updateProduct.mutateAsync({ productId: selectedProduct.id!, data: { aiInsights: aiData } });
        toast.success('Insight AI berhasil digenerate & disimpan!');
      } else {
        toast.error('Gagal menghasilkan AI Insight: ' + data.error);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan saat menghubungi AI.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (!isOpen || !tenant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] sm:max-h-[88vh] my-auto flex flex-col md:flex-row overflow-hidden border border-slate-200 animate-in zoom-in-95">
        
        {/* PANEL KIRI: Daftar Produk Tenant */}
        <div className={`w-full md:w-80 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex-col shrink-0 ${selectedProductId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 leading-tight">Kurasi Produk & Inovasi</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Tenant: <span className="text-emerald-600 font-bold">{tenant.name}</span></p>
            </div>
            <button onClick={onClose} className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg">
              <X size={18} />
            </button>
          </div>
          <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-2.5 custom-scrollbar">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Pilih Produk ({products.length}):</p>
            {products.map(product => (
              <button key={product.id} onClick={() => setSelectedProductId(product.id!)} className={`w-full text-left p-3.5 rounded-xl border transition-all ${selectedProductId === product.id ? 'bg-emerald-50 border-emerald-500 shadow-xs' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                <p className={`font-bold text-sm truncate ${selectedProductId === product.id ? 'text-emerald-800' : 'text-slate-700'}`}>{product.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  {product.isCurated ? <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Skor: {product.curation?.totalScore || 0}</span> : <span className="text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-500 px-2 py-0.5 rounded">Belum Dikurasi</span>}
                  {product.aiInsights && <span title="AI Insight Tersedia" className="flex items-center"><Sparkles size={12} className="text-amber-500" /></span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* PANEL KANAN: Form Engine Kurasi */}
        <div className={`flex-1 flex-col bg-white relative ${selectedProductId ? 'flex' : 'hidden md:flex'}`}>
          {/* Mobile Back Button */}
          <div className="md:hidden p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setSelectedProductId(null)}
              className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline"
            >
              ← Kembali ke Daftar Produk
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <X size={18} />
            </button>
          </div>

          <button onClick={onClose} className="hidden md:flex absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors z-10"><X size={20}/></button>
          
          {!selectedProduct ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <Target className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-bold text-base sm:text-lg text-slate-600">Pilih Produk untuk Dikurasi</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">Pilih salah satu item di panel kiri untuk mulai penilaian kurasi dan penayangan ke E-Katalog.</p>
            </div>
          ) : (
            <>
              {/* Header Info Produk */}
              <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-100 flex gap-3 sm:gap-4 shrink-0">
                 <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                    {selectedProduct.images?.[0] ? <img src={selectedProduct.images[0]} className="w-full h-full object-cover" /> : <Package className="w-7 h-7 sm:w-8 sm:h-8 m-3.5 sm:m-4 text-slate-300" />}
                 </div>
                 <div className="min-w-0 pr-8">
                   <h3 className="text-base sm:text-xl font-black text-slate-800 tracking-tight leading-tight mb-1 truncate">{selectedProduct.name}</h3>
                   <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{selectedProduct.description}</p>
                 </div>
              </div>

              {/* Engine Slider Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/50">
                
                {/* Result & AI Card */}
                <div className="bg-slate-900 rounded-2xl p-6 text-white mb-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
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

                {/* INTEGRASI PROMOSI KE MASTER E-KATALOG */}
                <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Rocket size={14} className="text-indigo-600" /> Promosi ke Etalase Master E-Katalog (/katalog)
                    </h4>
                    <p className="text-[11px] text-indigo-700/80">
                      Tayangkan produk tenant yang telah terkurasi ke halaman publik <code className="font-mono">/e-katalog</code> agar dapat dipesan langsung.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min="0"
                      placeholder="Harga Jual (Rp)"
                      value={catalogPrice || ''}
                      onChange={e => setCatalogPrice(Number(e.target.value))}
                      className="w-36 px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handlePromoteToCatalog}
                      disabled={isPromoting}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-60 whitespace-nowrap"
                    >
                      {isPromoting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                      Tayangkan ke E-Katalog
                    </button>
                  </div>
                </div>

                {/* TAMPILAN AI INSIGHTS JIKA ADA */}
                {selectedProduct.aiInsights && (
                   <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 animate-in slide-in-from-top-2">
                      <h4 className="text-sm font-black text-amber-800 mb-3 flex items-center gap-2"><Sparkles size={16}/> AI Curation Recommendations</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-amber-900/80">
                         <div><strong className="block text-amber-900 mb-0.5">Target Pasar:</strong> {selectedProduct.aiInsights.targetMarket}</div>
                         <div><strong className="block text-amber-900 mb-0.5">Saran Harga:</strong> {selectedProduct.aiInsights.idealPrice || (selectedProduct.aiInsights as any).pricingAndMonetization}</div>
                         <div><strong className="block text-amber-900 mb-0.5">Kanal Distribusi:</strong> {selectedProduct.aiInsights.distributionChannel || (selectedProduct.aiInsights as any).distributionAndGrowth}</div>
                         <div><strong className="block text-amber-900 mb-0.5">Perbaikan Kemasan / Produk:</strong> {selectedProduct.aiInsights.packagingImprovement || (selectedProduct.aiInsights as any).productImprovement}</div>
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
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Skor Kurasi
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
