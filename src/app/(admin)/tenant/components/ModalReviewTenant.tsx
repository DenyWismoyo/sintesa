// Lokasi file: src/app/admin/tenant/components/ModalReviewTenant.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Target, Package, UserCheck, Loader2, CheckCircle2, 
  XCircle, AlertCircle, Edit3, Briefcase, Activity, Landmark, Globe,
  Building, Sparkles, ChevronRight, ArrowUpRight
} from 'lucide-react';
import { Tenant } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onSaveDecision: (tenantId: string, decisionData: Partial<Tenant>) => Promise<void>;
}

// Komponen Helper untuk merender Data Blok agar konsisten dan rapi
const DataBlock = ({ label, value, isList = false }: { label: string, value: any, isList?: boolean }) => {
  if (!value || (isList && Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
      {isList && Array.isArray(value) ? (
        <ul className="list-disc pl-4 space-y-1">
          {value.map((v, i) => <li key={i} className="text-sm font-semibold text-slate-800">{v}</li>)}
        </ul>
      ) : (
        <p className="text-sm font-semibold text-slate-800 leading-snug">{value}</p>
      )}
    </div>
  );
};

export default function ModalReviewTenant({ isOpen, onClose, tenant, onSaveDecision }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'AI' | 'Data'>('AI');
  
  // State Form Keputusan
  const [decision, setDecision] = useState<'Aktif' | 'Ditolak' | null>(null);
  const [pipelineStage, setPipelineStage] = useState('Pra-Inkubasi');
  const [mentor, setMentor] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // State Override
  const [isOverride, setIsOverride] = useState(false);
  const [manualScore, setManualScore] = useState<number>(0);
  const [manualLevel, setManualLevel] = useState<string>('Pre-Incubation');

  useEffect(() => {
    if (tenant?.aiCurationData) {
      setManualScore(tenant.aiCurationData.totalScore || 0);
      setManualLevel(tenant.aiCurationData.readinessLevel || 'Pre-Incubation');
    }
  }, [tenant]);

  if (!isOpen || !tenant) return null;

  const aiData = tenant.aiCurationData;
  const selfAsses = (tenant.selfAssessment || {}) as any;
  const trackType = selfAsses?.trackType || tenant.segment || 'Startup'; // Jasa | UMKM | Startup

  const handleSubmit = async () => {
    if (!decision) return alert("Pilih keputusan (Terima/Tolak) terlebih dahulu.");
    setIsSubmitting(true);
    
    const updatePayload: Partial<Tenant> = {
      status: decision === 'Aktif' ? 'Aktif' : 'Non-aktif',
      pipelineStage: decision === 'Aktif' ? (pipelineStage as any) : undefined,
      mentor: mentor || undefined,
      isVerified: decision === 'Aktif',
    };

    if (aiData || isOverride) {
      updatePayload.aiCurationData = {
        ...(aiData || {}),
        totalScore: isOverride ? manualScore : (aiData?.totalScore || 0),
        readinessLevel: isOverride ? manualLevel : (aiData?.readinessLevel || 'TBA'),
        isManuallyAdjusted: isOverride,
        adjustmentNotes: internalNotes
      } as any; 
    }

    if (decision === 'Aktif' && (isOverride || tenant.smeReadinessLevel)) {
       updatePayload.smeReadinessLevel = isOverride ? (manualLevel as any) : tenant.smeReadinessLevel;
    }

    await onSaveDecision(tenant.id!, updatePayload);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col md:flex-row overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* ========================================================= */}
        {/* PANEL KIRI: DATA ROOM & AI CO-PILOT (READ-ONLY) */}
        {/* ========================================================= */}
        <div className="w-full md:w-[60%] bg-slate-50 border-r border-slate-200 flex flex-col h-full overflow-hidden shrink-0">
          
          {/* Header Data Room */}
          <div className="p-6 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200 overflow-hidden shrink-0">
                {tenant.logoUrl ? <img src={tenant.logoUrl} className="w-full h-full object-contain" /> : <Building className="w-6 h-6 text-slate-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">{tenant.name}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                    Kategori: {trackType}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500">Founder: {tenant.ownerName} • Berdiri: {selfAsses.tahunBerdiri || '-'}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-6 border-b border-slate-200 pb-px">
              <button onClick={() => setActiveTab('AI')} className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'AI' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Sparkles size={16}/> AI Co-Pilot Review
              </button>
              <button onClick={() => setActiveTab('Data')} className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'Data' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Briefcase size={16}/> Raw Data Assesment
              </button>
            </div>
          </div>

          {/* Area Scroll Data */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            {/* VIEW 1: AI CO-PILOT */}
            {activeTab === 'AI' && (
              <div className="space-y-6 animate-in fade-in">
                {aiData ? (
                  <>
                    <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-slate-300/50">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                           <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2"><Sparkles size={14}/> Final Readiness Score</p>
                           <div className="flex items-end gap-3">
                             <span className="text-6xl font-black leading-none">{aiData.totalScore}</span>
                             <span className="text-slate-400 font-medium pb-2">/ 100</span>
                           </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-2xl text-center">
                           <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-1">Status Kesiapan</p>
                           <p className="text-xl font-black text-emerald-400">{aiData.readinessLevel}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Produk/Tech</p><p className="text-3xl font-black text-slate-800">{aiData.scoreBreakdown?.productAndTech || 0}</p></div>
                       <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Pasar/Finansial</p><p className="text-3xl font-black text-slate-800">{aiData.scoreBreakdown?.marketAndFinancial || 0}</p></div>
                       <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Legal/Kepatuhan</p><p className="text-3xl font-black text-slate-800">{aiData.scoreBreakdown?.legalAndCompliance || 0}</p></div>
                    </div>

                    {aiData.recommendations && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6">
                        <h3 className="text-sm font-black text-indigo-900 mb-4 flex items-center gap-2 border-b border-indigo-200/50 pb-3">
                          <Target size={16} /> Insight & Rekomendasi AI
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-white/60 p-4 rounded-xl border border-indigo-100"><p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Target Pasar</p><p className="text-sm font-medium text-slate-700">{aiData.recommendations.targetMarket}</p></div>
                          <div className="bg-white/60 p-4 rounded-xl border border-indigo-100"><p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Monetisasi</p><p className="text-sm font-medium text-slate-700">{aiData.recommendations.pricingAndMonetization}</p></div>
                          <div className="bg-white/60 p-4 rounded-xl border border-indigo-100"><p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Distribusi & Growth</p><p className="text-sm font-medium text-slate-700">{aiData.recommendations.distributionAndGrowth}</p></div>
                          <div className="bg-white/60 p-4 rounded-xl border border-indigo-100"><p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Improvement Produk</p><p className="text-sm font-medium text-slate-700">{aiData.recommendations.productImprovement}</p></div>
                        </div>

                        {aiData.recommendations.nextActionSteps && (
                          <div className="mt-4 bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
                            <p className="text-[10px] font-black text-indigo-600 uppercase mb-3">Action Plan (Tindak Lanjut)</p>
                            <ul className="space-y-2">
                              {aiData.recommendations.nextActionSteps.map((step: string, i: number) => (
                                <li key={i} className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={16} className="text-emerald-500 shrink-0"/> {step}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                     <AlertCircle size={32} className="text-amber-500 mb-3" />
                     <p className="font-bold text-amber-800">Analisis AI belum digenerate atau gagal dimuat.</p>
                     <p className="text-xs text-amber-600/80 mt-1">Silakan tinjau data raw secara manual.</p>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: RAW DATA ASSESMENT */}
            {activeTab === 'Data' && (
              <div className="space-y-6 animate-in fade-in">
                
                {/* BLOK 1: Profil & Identitas Dasar (Semua Track) */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3"><Briefcase size={16} className="text-slate-400"/> Identitas Bisnis</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DataBlock label="Email Resmi" value={selfAsses.email} />
                    <DataBlock label="WhatsApp" value={selfAsses.whatsapp} />
                    <DataBlock label="Alamat" value={selfAsses.alamat} />
                    <DataBlock label="Website/Portofolio" value={selfAsses.website || selfAsses.instagram || selfAsses.tiktok} />
                    {trackType === 'Startup' && (
                      <div className="col-span-1 sm:col-span-2 space-y-3 mt-2 border-t border-slate-100 pt-3">
                         <DataBlock label="Problem Statement (Masalah)" value={selfAsses.masalah} />
                         <DataBlock label="Solusi Statement (Produk)" value={selfAsses.solusi} />
                      </div>
                    )}
                    {trackType === 'UMKM' && (
                      <div className="col-span-1 sm:col-span-2 space-y-3 mt-2 border-t border-slate-100 pt-3">
                         <DataBlock label="Deskripsi Produk" value={selfAsses.deskripsi} />
                         <DataBlock label="Keunggulan Utama" value={selfAsses.keunggulan} isList={true} />
                      </div>
                    )}
                  </div>
                </div>

                {/* BLOK 2: DATA SPESIFIK BERDASARKAN TRACK */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3"><Activity size={16} className="text-blue-500"/> Operasional & Traksi ({trackType})</h3>
                  
                  {/* --- KHUSUS STARTUP --- */}
                  {trackType === 'Startup' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DataBlock label="Status Produk (TRL)" value={selfAsses.statusProduk} />
                      <DataBlock label="Model Monetisasi" value={selfAsses.modelMonetisasi} />
                      <DataBlock label="Unfair Advantage (Moat)" value={selfAsses.unfairAdvantage} isList={true} />
                      <DataBlock label="Komposisi Tim Inti" value={selfAsses.komposisiTim} isList={true} />
                      
                      <div className="col-span-1 sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                         <div><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">MRR / GMV</p><p className="font-black text-slate-900">{selfAsses.mrr || '-'}</p></div>
                         <div><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Active Users</p><p className="font-black text-slate-900">{selfAsses.activeUsers || '-'}</p></div>
                         <div><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Gross Margin</p><p className="font-black text-slate-900">{selfAsses.grossMargin || '-'}</p></div>
                         <div><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">LTV:CAC</p><p className="font-black text-slate-900">{selfAsses.ltvCacRatio || '-'}</p></div>
                      </div>

                      <DataBlock label="Status Pendanaan Terakhir" value={selfAsses.statusPendanaan} />
                      <DataBlock label="Runway (Ketahanan Kas)" value={selfAsses.runway} />
                      <DataBlock label="Target Pendanaan Dicari" value={selfAsses.budgetMarketing} />
                      <DataBlock label="Bentuk Instrumen Investasi" value={selfAsses.bentukPendanaan} />
                    </div>
                  )}

                  {/* --- KHUSUS UMKM --- */}
                  {trackType === 'UMKM' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DataBlock label="Kapasitas Produksi Bulanan" value={selfAsses.kapasitas} />
                      <DataBlock label="Sistem Produksi" value={selfAsses.sistemProduksi} />
                      <DataBlock label="Konsistensi Produksi" value={selfAsses.konsistensi} />
                      <DataBlock label="Omset Rata-rata Bulanan" value={selfAsses.omset} />
                      <DataBlock label="Legalitas & Sertifikasi" value={selfAsses.legalitas} isList={true} />
                      <DataBlock label="Status Merek (Brand)" value={selfAsses.statusMerek} />
                      <DataBlock label="Channel Penjualan" value={selfAsses.channels} isList={true} />
                      <DataBlock label="Kendala Utama" value={selfAsses.kendala} isList={true} />
                      <div className="col-span-1 sm:col-span-2">
                        <DataBlock label="Kualitas Kemasan Saat Ini" value={selfAsses.kualitasKemasan} />
                      </div>
                    </div>
                  )}

                  {/* --- KHUSUS JASA --- */}
                  {trackType === 'Jasa' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DataBlock label="Ukuran Tim" value={selfAsses.tenagaKerja} />
                      <DataBlock label="Sistem Kerja Tim (Inhouse/Outsource)" value={selfAsses.sistemProduksi} />
                      <DataBlock label="Model Harga (Pricing) Dominan" value={selfAsses.modelBisnis} />
                      <DataBlock label="Rata-rata Nilai Proyek (AOV)" value={selfAsses.averageOrderValue} />
                      <DataBlock label="Rata-rata Omset Bulanan" value={selfAsses.omset} />
                      <DataBlock label="Tingkat Retensi Klien" value={selfAsses.customerRetention} />
                      <DataBlock label="Strategi Akuisisi Klien" value={selfAsses.channels} isList={true} />
                      <DataBlock label="Kendala Operasional Kritis" value={selfAsses.kendala} isList={true} />
                      <div className="col-span-1 sm:col-span-2 mt-2">
                        <DataBlock label="Status Legalitas Administrasi" value={selfAsses.legalitas} isList={true} />
                        <DataBlock label="Target/Harapan Inkubasi" value={selfAsses.deskripsi} />
                      </div>
                    </div>
                  )}

                </div>

                {/* BLOK 3: LAMPIRAN FILE */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3"><Globe size={16} className="text-emerald-500"/> Lampiran Dokumen</h3>
                  <div className="flex flex-wrap gap-3">
                    {tenant.pitchDeckUrl ? <a href={tenant.pitchDeckUrl} target="_blank" className="text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg flex items-center gap-2"><ArrowUpRight size={14}/> Lihat Pitch Deck / Portofolio</a> : <span className="text-xs text-slate-400 italic bg-slate-50 px-4 py-2 rounded-lg">Pitch Deck Tidak Tersedia</span>}
                    {tenant.legalDocUrl ? <a href={tenant.legalDocUrl} target="_blank" className="text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg flex items-center gap-2"><ArrowUpRight size={14}/> Lihat Legalitas / NIB</a> : <span className="text-xs text-slate-400 italic bg-slate-50 px-4 py-2 rounded-lg">Legalitas Tidak Tersedia</span>}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* PANEL KANAN: FORM KEPUTUSAN KOMITE & OVERRIDE */}
        {/* ========================================================= */}
        <div className="w-full md:w-[40%] flex flex-col h-full bg-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors z-10"><X size={20}/></button>
          
          <div className="p-6 md:p-8 pt-12 flex-1 overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Validasi Akhir</h2>
            <p className="text-sm text-slate-500 mb-6 border-b border-slate-100 pb-4">Tinjau ulang data, koreksi skor AI jika perlu, dan putuskan status tenant.</p>

            <div className="space-y-6">
              
              {/* SEKSI 1: OVERRIDE SCORE AI */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={isOverride} 
                    onChange={e => setIsOverride(e.target.checked)} 
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 mt-0.5 cursor-pointer"
                  />
                  <div>
                      <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Sesuaikan Skor Manual (Override)</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">Gunakan ini jika hasil wawancara berbeda drastis dengan skor AI.</p>
                  </div>
                </label>

                {isOverride && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5"><Edit3 size={12} className="inline mr-1"/> Skor Manual</label>
                        <input type="number" min="0" max="100" value={manualScore} onChange={e => setManualScore(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5"><Target size={12} className="inline mr-1"/> Readiness Level</label>
                        <select value={manualLevel} onChange={e => setManualLevel(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 outline-none cursor-pointer">
                          <option value="Pre-Incubation">Pre-Incubation</option>
                          <option value="Development Needed">Development Needed</option>
                          <option value="Market Ready">Market Ready</option>
                          <option value="Retail Ready">Retail Ready</option>
                          <option value="Premium Export Ready">Premium Export</option>
                        </select>
                      </div>
                  </div>
                )}
              </div>

              {/* SEKSI 2: KEPUTUSAN FINAL */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">Keputusan Komite Inkubator</h3>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <label className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${decision === 'Aktif' ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100/50' : 'border-slate-200 hover:border-emerald-300 bg-white'}`}>
                    <CheckCircle2 className={`w-8 h-8 mb-2 ${decision === 'Aktif' ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span className={`text-sm font-black ${decision === 'Aktif' ? 'text-emerald-700' : 'text-slate-500'}`}>Terima (Aktif)</span>
                    <input type="radio" name="decision" className="hidden" checked={decision === 'Aktif'} onChange={() => setDecision('Aktif')} />
                  </label>
                  
                  <label className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${decision === 'Ditolak' ? 'border-rose-500 bg-rose-50 shadow-md shadow-rose-100/50' : 'border-slate-200 hover:border-rose-300 bg-white'}`}>
                    <XCircle className={`w-8 h-8 mb-2 ${decision === 'Ditolak' ? 'text-rose-500' : 'text-slate-300'}`} />
                    <span className={`text-sm font-black ${decision === 'Ditolak' ? 'text-rose-700' : 'text-slate-500'}`}>Tolak / Pending</span>
                    <input type="radio" name="decision" className="hidden" checked={decision === 'Ditolak'} onChange={() => setDecision('Ditolak')} />
                  </label>
                </div>

                {decision === 'Aktif' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 mb-5">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-widest mb-1.5">Tempatkan di Pipeline</label>
                      <select value={pipelineStage} onChange={(e) => setPipelineStage(e.target.value)} className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer">
                        <option value="Pra-Inkubasi">1. Pra-Inkubasi (Bootstrapping)</option>
                        <option value="Validasi Ide">2. Validasi Ide & Bisnis</option>
                        <option value="Pengembangan Produk">3. Pengembangan Produk / MVP</option>
                        <option value="Go-To-Market">4. Akselerasi (Go-To-Market)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-widest mb-1.5">Tetapkan Mentor Awal (Opsional)</label>
                      <input type="text" value={mentor} onChange={(e) => setMentor(e.target.value)} placeholder="Nama Ahli / Mentor" className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-sm outline-none" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-1.5">Catatan Validasi Internal</label>
                  <textarea rows={3} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Tuliskan catatan internal, alasan penolakan, atau justifikasi override..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                </div>
              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <button onClick={onClose} disabled={isSubmitting} className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
            <button onClick={handleSubmit} disabled={isSubmitting || !decision} className={`px-8 py-3 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all ${decision === 'Ditolak' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 text-white' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-300 text-white'}`}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <UserCheck className="w-4 h-4" />} Eksekusi Keputusan
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}