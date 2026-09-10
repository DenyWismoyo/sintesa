'use client';

import React from 'react';
import { ShieldCheck, Package, Target, Sparkles, Globe, Activity, Route, ListChecks, CheckSquare, ArrowRight } from 'lucide-react';
import CurationPdfExport from './CurationPdfExport';

interface Props {
  trackType: string;
  formData: any;
  aiResult: any;
  onSubmit: () => void;
  onRestart: () => void;
}

export default function CurationDashboard({ trackType, formData, aiResult, onSubmit, onRestart }: Props) {
  const averageScore = Math.round(
    ((aiResult?.scoreBreakdown?.productAndTech || 0) + 
     (aiResult?.scoreBreakdown?.marketAndFinancial || 0) + 
     (aiResult?.scoreBreakdown?.legalAndCompliance || 0)) / 3
  ) || 0;
  
  const isHighTier = averageScore >= 75;

  return (
    <div className="flex-1 w-full bg-slate-50 relative overflow-hidden animate-in fade-in duration-700 min-h-[calc(100vh-5.5rem)] py-12 px-6 lg:px-16 xl:px-24">
      <div className="w-full max-w-7xl mx-auto relative z-10">
        
        {/* Header Action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Hasil Kurasi Bisnis</h1>
            <p className="text-slate-500 mt-2 font-medium">{formData.namaUsaha}</p>
          </div>
          <button onClick={onRestart} className="text-sm px-5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-full text-indigo-600 font-bold hover:bg-indigo-50 transition-colors">
            Mulai Asesmen Baru
          </button>
        </div>

        {/* Hero Score Banner - Full Width */}
        <div className={`rounded-[2rem] p-8 md:p-12 lg:p-16 text-white shadow-2xl mb-8 flex flex-col md:flex-row justify-between md:items-center relative overflow-hidden ${isHighTier ? 'bg-gradient-to-br from-emerald-600 to-teal-800' : 'bg-gradient-to-br from-indigo-600 to-blue-800'}`}>
           <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
           
           <div className="relative z-10">
              <p className="text-white/80 text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck size={20}/> Readiness Level Assessment
              </p>
              <div className="flex items-end gap-6 mt-4">
                <span className="text-8xl lg:text-9xl font-black leading-none tracking-tighter">{averageScore}</span>
                <div className="pb-4">
                  <span className="text-sm md:text-lg font-bold bg-white/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/30 block w-fit">
                    {aiResult?.readinessLevel || 'TBA'}
                  </span>
                </div>
              </div>
           </div>
        </div>

        {/* Score Breakdown (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Package size={16} className="text-blue-500"/> {trackType === 'Startup' ? 'Skalabilitas & Tech' : trackType === 'Jasa' ? 'Kapasitas & Tim' : 'Produksi & Suplai'}
            </p>
            <div className="flex items-center gap-5">
              <span className="text-4xl font-black text-slate-800 w-16">{aiResult?.scoreBreakdown?.productAndTech || 0}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden"><div className="bg-blue-500 h-3 rounded-full" style={{ width: `${aiResult?.scoreBreakdown?.productAndTech || 0}%` }}></div></div>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Target size={16} className="text-indigo-500"/> Unit Economics & Finansial
            </p>
            <div className="flex items-center gap-5">
              <span className="text-4xl font-black text-slate-800 w-16">{aiResult?.scoreBreakdown?.marketAndFinancial || 0}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden"><div className="bg-indigo-500 h-3 rounded-full" style={{ width: `${aiResult?.scoreBreakdown?.marketAndFinancial || 0}%` }}></div></div>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-500"/> Tata Kelola & Kepatuhan
            </p>
            <div className="flex items-center gap-5">
              <span className="text-4xl font-black text-slate-800 w-16">{aiResult?.scoreBreakdown?.legalAndCompliance || 0}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden"><div className="bg-amber-500 h-3 rounded-full" style={{ width: `${aiResult?.scoreBreakdown?.legalAndCompliance || 0}%` }}></div></div>
            </div>
          </div>
        </div>

        {/* Bento Grid: Recommendations & Action Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
           
           {/* Rekomendasi (Takes 2 Columns) */}
           <div className="lg:col-span-2 bg-white rounded-3xl p-8 lg:p-10 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Sparkles size={24}/></div>
                <h3 className="font-black text-slate-900 text-2xl tracking-tight">AI Strategic Recommendations</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Globe size={16}/> Potensi Pasar</h4>
                   <p className="text-sm bg-slate-50 p-5 rounded-2xl border border-slate-100 font-medium text-slate-700 leading-relaxed min-h-[100px]">{aiResult?.recommendations?.targetMarket}</p>
                </div>
                <div className="space-y-3">
                   <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Activity size={16}/> Strategi Monetisasi</h4>
                   <p className="text-sm bg-slate-50 p-5 rounded-2xl border border-slate-100 font-medium text-slate-700 leading-relaxed min-h-[100px]">{aiResult?.recommendations?.pricingAndMonetization}</p>
                </div>
                <div className="space-y-3">
                   <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Target size={16}/> Distribusi & Growth</h4>
                   <p className="text-sm bg-slate-50 p-5 rounded-2xl border border-slate-100 font-medium text-slate-700 leading-relaxed min-h-[100px]">{aiResult?.recommendations?.distributionAndGrowth}</p>
                </div>
                <div className="space-y-3">
                   <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Package size={16}/> Pengembangan Layanan</h4>
                   <p className="text-sm bg-slate-50 p-5 rounded-2xl border border-slate-100 font-medium text-slate-700 leading-relaxed min-h-[100px]">{aiResult?.recommendations?.productImprovement}</p>
                </div>
              </div>
           </div>

           {/* Action Plan & Route (Takes 1 Column) */}
           {aiResult?.recommendations?.nextActionSteps && (
             <div className="lg:col-span-1 flex flex-col gap-6">
                
                {/* Incubation Route Card */}
                <div className={`p-8 rounded-3xl text-center border-2 shadow-sm ${isHighTier ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : averageScore >= 60 ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                  <Route size={40} className={`mx-auto mb-4 ${isHighTier ? 'text-emerald-500' : averageScore >= 60 ? 'text-blue-500' : 'text-amber-500'}`} />
                  <p className="text-[11px] font-black uppercase tracking-widest opacity-70 mb-2">Rekomendasi Program</p>
                  <h4 className="text-2xl font-black leading-tight tracking-tight">
                    {aiResult.recommendations.incubationRoute || (isHighTier ? 'Akselerasi / Post-Inkubasi' : averageScore >= 60 ? 'Inkubasi Reguler' : 'Pra-Inkubasi (Bootstrapping)')}
                  </h4>
                </div>

                {/* Action Steps */}
                <div className="flex-1 bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 shadow-sm flex flex-col">
                   <h3 className="font-black text-indigo-900 text-lg tracking-tight mb-6 flex items-center gap-2">
                     <ListChecks size={20} className="text-indigo-600"/> Rencana Tindak Lanjut
                   </h3>
                   <div className="space-y-4 flex-1">
                     {aiResult.recommendations.nextActionSteps.map((step: string, idx: number) => (
                       <div key={idx} className="flex items-start gap-3 bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
                         <CheckSquare className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                         <p className="text-sm text-slate-700 font-medium leading-relaxed">{step}</p>
                       </div>
                     ))}
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-col lg:flex-row gap-6 w-full mt-12 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="w-full lg:w-1/3">
             <CurationPdfExport trackType={trackType} formData={formData} aiResult={aiResult} />
          </div>
          <button 
             onClick={onSubmit} 
             className="w-full lg:w-2/3 py-5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all duration-300 shadow-xl hover:shadow-indigo-600/30 flex items-center justify-center gap-3 text-lg group"
          >
             Kirim Data ke Database Inkubator Nasional <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
}