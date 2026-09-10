import React, { useMemo } from 'react';
import { Tenant } from '@/types';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, DollarSign, Activity, 
  Flame, Briefcase, Landmark, ShieldCheck, 
  AlertCircle, PieChart, BarChart2, Building2
} from 'lucide-react';

interface Props {
  tenants: Tenant[];
}

export default function PortfolioAnalyticsDashboard({ tenants }: Props) {
  
  // Agregasi Data Makro Ekosistem
  const analytics = useMemo(() => {
    let totalFunding = 0;
    let totalValuation = 0;
    let totalJobs = 0;
    let activeStartups = 0;
    let totalAlumni = 0;

    const healthCounts = { Healthy: 0, Warning: 0, Critical: 0, Unknown: 0 };
    const stageCounts = { 
      'Pra-Inkubasi': 0, 
      'Validasi Ide': 0, 
      'Pengembangan Produk': 0, 
      'Go-To-Market': 0, 
      'Alumni': 0 
    } as Record<string, number>;
    
    const sectorCounts: Record<string, number> = {};

    tenants.forEach(tenant => {
      // Status
      if (tenant.status === 'Aktif') activeStartups++;
      if (tenant.status === 'Alumni' || tenant.pipelineStage === 'Alumni') totalAlumni++;

      // Pendanaan Terkumpul (Funding)
      const tenantFunding = tenant.fundingRounds?.reduce((acc, round) => acc + (round.amount || 0), 0) || 0;
      totalFunding += tenantFunding;

      // Valuasi Portofolio (Exit Valuation atau Valuasi Round Terakhir)
      let tenantVal = tenant.exitValuation || 0;
      if (!tenantVal && tenant.fundingRounds && tenant.fundingRounds.length > 0) {
        const roundsWithVal = tenant.fundingRounds.filter(r => r.valuation && r.valuation > 0);
        if (roundsWithVal.length > 0) {
          tenantVal = roundsWithVal[roundsWithVal.length - 1].valuation || 0;
        }
      }
      totalValuation += tenantVal;

      // Total Lapangan Kerja / Ukuran Tim
      totalJobs += tenant.teamSize || 1; 

      // Kesehatan Startup (Health Score)
      const health = tenant.currentHealthScore || 'Unknown';
      if (healthCounts[health as keyof typeof healthCounts] !== undefined) {
        healthCounts[health as keyof typeof healthCounts]++;
      }

      // Distribusi Pipeline Stage
      const stage = tenant.pipelineStage || 'Pra-Inkubasi';
      if (stageCounts[stage] !== undefined) {
        stageCounts[stage]++;
      }

      // Distribusi Sektor Bisnis
      const sector = tenant.sector || 'Lainnya';
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    });

    return { 
      totalFunding, totalValuation, totalJobs, 
      activeStartups, totalAlumni, healthCounts, 
      stageCounts, sectorCounts 
    };
  }, [tenants]);

  const formatRupiah = (angka: number) => {
    if (angka >= 1000000000) return `Rp ${(angka / 1000000000).toFixed(1)} Miliar`;
    if (angka >= 1000000) return `Rp ${(angka / 1000000).toFixed(1)} Juta`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const totalHealthTracked = analytics.healthCounts.Healthy + analytics.healthCounts.Warning + analytics.healthCounts.Critical;
  const healthyPct = totalHealthTracked > 0 ? (analytics.healthCounts.Healthy / totalHealthTracked) * 100 : 0;
  const warningPct = totalHealthTracked > 0 ? (analytics.healthCounts.Warning / totalHealthTracked) * 100 : 0;
  const criticalPct = totalHealthTracked > 0 ? (analytics.healthCounts.Critical / totalHealthTracked) * 100 : 0;

  return (
    <div className="space-y-6 mb-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
               <PieChart className="text-indigo-600 w-7 h-7" /> Portfolio Analytics
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">
               Ringkasan performa dan metrik dampak (Impact Metrics) seluruh ekosistem inkubator.
            </p>
         </div>
         <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> Real-time Data
         </div>
      </div>

      {/* METRIK MAKRO (TOP CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 opacity-10"><TrendingUp size={120} /></div>
          <div className="relative z-10">
            <p className="text-indigo-100 text-[11px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"><ShieldCheck size={14}/> Total Valuasi Portofolio</p>
            <h3 className="text-3xl font-black mb-1">{formatRupiah(analytics.totalValuation)}</h3>
            <p className="text-indigo-200 text-xs font-medium">Estimasi AUM (Asset Under Management)</p>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[2rem] text-white shadow-xl shadow-emerald-200 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 opacity-10"><DollarSign size={120} /></div>
          <div className="relative z-10">
            <p className="text-emerald-100 text-[11px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"><Landmark size={14}/> Total Dana Terkumpul</p>
            <h3 className="text-3xl font-black mb-1">{formatRupiah(analytics.totalFunding)}</h3>
            <p className="text-emerald-100 text-xs font-medium">Investasi Eksternal & Hibah Diraih</p>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
          <div className="absolute -right-4 -bottom-4 opacity-5 text-blue-600 group-hover:scale-110 transition-transform"><Building2 size={100} /></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Building2 size={20}/></div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Startups & Alumni</p>
            <h3 className="text-3xl font-black text-slate-800">
               {analytics.activeStartups} <span className="text-lg text-slate-400 font-bold ml-1">/ {analytics.totalAlumni} Alumni</span>
            </h3>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-colors">
          <div className="absolute -right-4 -bottom-4 opacity-5 text-purple-600 group-hover:scale-110 transition-transform"><Briefcase size={100} /></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4"><Users size={20}/></div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Penciptaan Lapangan Kerja</p>
            <h3 className="text-3xl font-black text-slate-800">{analytics.totalJobs.toLocaleString('id-ID')} <span className="text-lg text-slate-400 font-bold ml-1">Orang</span></h3>
          </div>
        </motion.div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SURVIVAL & HEALTH DISTRIBUTION */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-6"><Activity className="text-red-500 w-4 h-4"/> Indikator Kesehatan Startup</h3>
          
          <div className="flex-1 flex flex-col justify-center">
             {/* Progress Bar Chart */}
             <div className="w-full h-8 rounded-full overflow-hidden flex mb-6 shadow-inner bg-slate-100">
                <div title={`Sehat: ${healthyPct.toFixed(1)}%`} className="h-full bg-emerald-500 hover:opacity-90 transition-opacity" style={{ width: `${healthyPct}%` }} />
                <div title={`Stagnan: ${warningPct.toFixed(1)}%`} className="h-full bg-amber-400 hover:opacity-90 transition-opacity" style={{ width: `${warningPct}%` }} />
                <div title={`Risiko: ${criticalPct.toFixed(1)}%`} className="h-full bg-red-500 hover:opacity-90 transition-opacity" style={{ width: `${criticalPct}%` }} />
             </div>

             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                      <span className="text-sm font-bold text-slate-700">Sehat (Growing)</span>
                   </div>
                   <span className="text-sm font-black text-slate-900">{analytics.healthCounts.Healthy} Startup</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm" />
                      <span className="text-sm font-bold text-slate-700">Waspada (Stagnan)</span>
                   </div>
                   <span className="text-sm font-black text-slate-900">{analytics.healthCounts.Warning} Startup</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
                      <span className="text-sm font-bold text-slate-700">Kritis (Risiko Gagal)</span>
                   </div>
                   <span className="text-sm font-black text-slate-900">{analytics.healthCounts.Critical} Startup</span>
                </div>
             </div>
          </div>
          
          {analytics.healthCounts.Critical > 0 && (
             <div className="mt-6 bg-red-50 border border-red-200 p-3 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-medium leading-relaxed">Terdapat <span className="font-bold">{analytics.healthCounts.Critical} startup</span> berisiko tinggi. Segera jadwalkan mentoring mitigasi krisis.</p>
             </div>
          )}
        </div>

        {/* PIPELINE STAGE FUNNEL */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-6"><BarChart2 className="text-blue-600 w-4 h-4"/> Pipeline Inkubasi (Funnel)</h3>
          
          <div className="grid grid-cols-5 gap-2 h-48 items-end">
            {Object.entries(analytics.stageCounts).map(([stage, count], idx) => {
              // Kalkulasi tinggi bar relatif terhadap max
              const maxCount = Math.max(...Object.values(analytics.stageCounts), 1);
              const heightPct = count === 0 ? 5 : (count / maxCount) * 100;
              
              const colors = ['bg-slate-300', 'bg-blue-300', 'bg-indigo-400', 'bg-purple-500', 'bg-emerald-500'];
              
              return (
                <div key={stage} className="flex flex-col items-center gap-3 group">
                   <div className="w-full flex flex-col justify-end items-center h-full relative">
                      <span className="absolute -top-6 text-sm font-black text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                      <div className={`w-full rounded-t-xl transition-all duration-700 shadow-sm ${colors[idx]}`} style={{ height: `${heightPct}%` }}></div>
                   </div>
                   <div className="text-center h-10">
                      <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider leading-tight">{stage}</p>
                   </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}