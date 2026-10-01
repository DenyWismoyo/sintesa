import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Building2, User, Phone, Mail, Package, Target, Receipt, CheckCircle2, 
  Trash2, LineChart, ListChecks, Video, MessageSquare, Landmark, Coins, 
  Calendar, Activity, Users, Plus, Flame, Hourglass, DollarSign, BarChart2,
  FileKey, PieChart, Download, ArrowUpRight, ShieldCheck, FileText, ChevronRight,
  Sparkles, Globe, ShoppingBag, Loader2, TrendingUp, AlertTriangle
} from 'lucide-react';
import { Tenant, Invoice, TenantKPI, MentoringSession, TenantRevenue, DynamicMetric } from '@/types';
import { 
  useTenantTeam, useTenantProducts, useTenantMilestones, 
  useTenantMonev, useTenantKPI, useTenantMentoring, useTenantRevenue, useTenants 
} from '@/hooks/useTenants';

interface Props {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  invoices?: Invoice[]; 
}

// PERUBAHAN FASE 3: Menambahkan tab 'curation' & 'health_ai'
type TabType = 'dashboard' | 'curriculum' | 'mentoring' | 'vdr' | 'portfolio' | 'finance' | 'curation' | 'health_ai';

interface CurriculumItem {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: number;
}

const DEFAULT_CURRICULUM: CurriculumItem[] = [
  { id: 'cur-1', title: 'Validasi Problem-Solution Fit', isCompleted: false },
  { id: 'cur-2', title: 'Business Model Canvas (BMC) Disetujui', isCompleted: false },
  { id: 'cur-3', title: 'Legalitas Badan Usaha (PT/CV) Terbit', isCompleted: false },
  { id: 'cur-4', title: 'Rilis Minimum Viable Product (MVP)', isCompleted: false },
  { id: 'cur-5', title: 'Mendapatkan Traksi (100 User Pertama)', isCompleted: false },
  { id: 'cur-6', title: 'Pitch Deck & Financial Model Final', isCompleted: false },
];

// Konfigurasi Tabs
const TABS: { id: TabType, label: string, icon: any }[] = [
  { id: 'curation', label: 'Hasil Kurasi AI', icon: ShieldCheck },
  { id: 'health_ai', label: 'Kesehatan Bisnis (AI)', icon: Activity },
  { id: 'dashboard', label: 'Overview & KPI', icon: BarChart2 },
  { id: 'curriculum', label: 'Kurikulum', icon: ListChecks },
  { id: 'mentoring', label: 'Mentoring & Logbook', icon: Users },
  { id: 'vdr', label: 'Data Room (VDR)', icon: FileKey },
  { id: 'portfolio', label: 'Portofolio', icon: Package },
  { id: 'finance', label: 'Keuangan & Exit', icon: Landmark },
];

const getCapTableColor = (type: string, index: number) => {
  if (type === 'Founder') return ['bg-slate-900', 'bg-slate-700', 'bg-slate-500'][index % 3] || 'bg-slate-700';
  if (type === 'Investor') return ['bg-blue-600', 'bg-blue-500', 'bg-blue-400'][index % 3] || 'bg-blue-500';
  if (type === 'Employee/ESOP') return 'bg-emerald-500';
  if (type === 'Advisor') return 'bg-amber-500';
  return 'bg-slate-300';
};

const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

export default function DrawerProfilTenant({ tenant, isOpen, onClose, invoices = [] }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  const { updateTenant } = useTenants();
  const { products } = useTenantProducts(tenant?.id);
  const { monevs, addMonev, removeMonev } = useTenantMonev(tenant?.id);
  const { kpis, addKPI, removeKPI } = useTenantKPI(tenant?.id);
  const { sessions, addSession, updateSession, removeSession } = useTenantMentoring(tenant?.id);
  const { revenues, addRevenue, removeRevenue } = useTenantRevenue(tenant?.id);

  const [isAddingMonev, setIsAddingMonev] = useState(false);
  const [newMonev, setNewMonev] = useState({ date: new Date().toISOString().split('T')[0], title: '', description: '' });
  
  const [isBookingSession, setIsBookingSession] = useState(false);
  const [newSession, setNewSession] = useState<Partial<MentoringSession>>({
    date: new Date().toISOString().split('T')[0], time: '10:00', topic: '', notes: ''
  });

  const [isAddingKPI, setIsAddingKPI] = useState(false);
  const [newKPI, setNewKPI] = useState<Partial<TenantKPI>>({
    period: 'Kuartal 1 - 2024', burnRate: 0, runwayMonths: 0, fundingAcquired: 0, healthStatus: 'Healthy', metrics: [], topAchievements: '', currentBottlenecks: '', notes: ''
  });
  const [metricInput, setMetricInput] = useState<Partial<DynamicMetric>>({
    name: '', unit: 'Rp', targetValue: 0, actualValue: 0, category: 'Traction'
  });

  const handleAddMetricToKPI = () => {
    if (!metricInput.name) return;
    setNewKPI(prev => ({...prev, metrics: [...(prev.metrics || []), { ...metricInput, id: crypto.randomUUID() } as DynamicMetric]}));
    setMetricInput({ name: '', unit: 'Rp', targetValue: 0, actualValue: 0, category: 'Traction' });
  };
  const handleRemoveMetricFromKPI = (idToRemove: string) => {
    setNewKPI(prev => ({...prev, metrics: (prev.metrics || []).filter(m => m.id !== idToRemove)}));
  };

  const [isAddingRevenue, setIsAddingRevenue] = useState(false);
  const [newRevenue, setNewRevenue] = useState<Partial<TenantRevenue>>({
    date: new Date().toISOString().split('T')[0], amount: 0, type: 'Profit Sharing', description: ''
  });
  const [exitData, setExitData] = useState({ status: 'Belum Lulus', valuation: 0 });

  useEffect(() => {
    if (tenant) {
      setExitData({ status: tenant.exitStatus || 'Belum Lulus', valuation: tenant.exitValuation || 0 });
      
      // PERUBAHAN FASE 3: Buka tab kurasi otomatis jika tenant masih review
      if (tenant.status === 'Menunggu Review') {
        setActiveTab('curation');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [tenant]);

  const curriculumItems: CurriculumItem[] = tenant?.curriculumChecklist && tenant.curriculumChecklist.length > 0 ? tenant.curriculumChecklist : DEFAULT_CURRICULUM;
  const completedCount = curriculumItems.filter(item => item.isCompleted).length;
  const progressPercent = Math.round((completedCount / curriculumItems.length) * 100) || 0;

  const handleToggleCurriculum = async (itemId: string, currentStatus: boolean) => {
    if (!tenant || !tenant.id) return;
    const updatedChecklist = curriculumItems.map(item => item.id === itemId ? { ...item, isCompleted: !currentStatus, completedAt: !currentStatus ? Date.now() : undefined } : item);
    await updateTenant(tenant.id, { curriculumChecklist: updatedChecklist });
  };

  const handleSaveExitStatus = async () => {
    if (!tenant || !tenant.id) return;
    await updateTenant(tenant.id, { exitStatus: exitData.status as any, exitValuation: exitData.valuation });
    alert('Status Exit & Valuasi Alumni disimpan!');
  };

  // State & Handler Analisis Kesehatan Bisnis AI (Clario DeepSeek Financial Pro)
  const [isAnalyzingHealth, setIsAnalyzingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [localHealthData, setLocalHealthData] = useState<any>(tenant?.aiHealthData || null);
  const lastTenantIdRef = useRef<string | undefined>(tenant?.id);

  useEffect(() => {
    if (tenant?.id !== lastTenantIdRef.current) {
      lastTenantIdRef.current = tenant?.id;
      setLocalHealthData(tenant?.aiHealthData || null);
    } else if (tenant?.aiHealthData) {
      setLocalHealthData(tenant.aiHealthData);
    }
  }, [tenant]);

  const handleAnalyzeHealth = async () => {
    if (!tenant || !tenant.id) return;
    setIsAnalyzingHealth(true);
    setHealthError(null);
    try {
      const payload = {
        tenantId: tenant.id,
        tenantName: tenant.name,
        segment: tenant.segment || 'StartUp',
        pipelineStage: tenant.pipelineStage || 'Pra-Inkubasi',
        fundingStage: tenant.fundingStage || 'Bootstrapped',
        teamSize: tenant.teamSize || 1,
        legalEntity: tenant.legalEntity || 'Belum Ada',
        description: tenant.companyDescription || tenant.selfAssessment?.deskripsi || tenant.elevatorPitch || '',
        valueProposition: tenant.solutionStatement || tenant.problemStatement || '',
        businessModel: (tenant as any).businessModel || tenant.selfAssessment?.modelBisnis || '',
        products: (products || []).map(p => ({
          name: p.name,
          category: p.category,
          description: p.description,
          businessModel: p.businessModel,
          status: p.status,
        })),
        monthlyRevenue: (revenues || []).map(r => ({
          month: r.date?.substring(0, 7) || '2026-01',
          amount: r.amount || 0
        })),
        kpiHistory: (kpis || []).map(k => ({
          quarter: k.period,
          revenue: (k.metrics || []).find(m => m.name.toLowerCase().includes('rev'))?.actualValue,
          activeUsers: (k.metrics || []).find(m => m.name.toLowerCase().includes('user'))?.actualValue,
          burnRate: k.burnRate,
          runwayMonths: k.runwayMonths,
        })),
        monevs: (monevs || []).map(m => ({
          date: m.date,
          title: m.title,
          description: m.description,
        })),
        mentoringSessions: (sessions || []).map(s => ({
          date: s.date,
          topic: s.topic,
          mentorName: s.mentorName,
          notes: s.notes,
        })),

        curriculumProgress: {
          completedCount,
          totalCount: curriculumItems.length,
          completedTitles: curriculumItems.filter(i => i.isCompleted).map(i => i.title),
          pendingTitles: curriculumItems.filter(i => !i.isCompleted).map(i => i.title),
        },
        selfAssessment: tenant.selfAssessment || {}
      };

      const res = await fetch('/api/ai/tenant-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(40000)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menganalisis kesehatan bisnis');
      }

      const rawHealthData = {
        healthStatus: data.healthStatus || 'Warning',
        healthScore: Number(data.healthScore) || 60,
        financialSustainability: Number(data.financialSustainability) || 50,
        marketTraction: Number(data.marketTraction) || 50,
        teamExecution: Number(data.teamExecution) || 60,
        summaryNarrative: data.summaryNarrative || '',
        radarMetrics: Array.isArray(data.radarMetrics) ? data.radarMetrics : [],
        swot: data.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        tacticalRoadmap: Array.isArray(data.tacticalRoadmap) ? data.tacticalRoadmap : [],
        keyStrengths: Array.isArray(data.keyStrengths) ? data.keyStrengths : [],
        riskFactors: Array.isArray(data.riskFactors) ? data.riskFactors : [],
        actionableRecommendations: Array.isArray(data.actionableRecommendations) ? data.actionableRecommendations : [],
        analyzedAt: data.analyzedAt || Date.now(),
        isFallback: !!data.isFallback
      };

      // Bersihkan nilai undefined secara menyeluruh agar Firestore updateDoc 100% sukses
      const cleanHealthData = JSON.parse(JSON.stringify(rawHealthData));

      setLocalHealthData(cleanHealthData);

      // Simpan langsung ke memori objek tenant aktif
      tenant.currentHealthScore = data.healthStatus || 'Warning';
      tenant.aiHealthData = cleanHealthData;

      // Simpan permanen ke dokumen Firestore tenants/{id}
      const saveRes = await updateTenant(tenant.id, {
        currentHealthScore: data.healthStatus || 'Warning',
        aiHealthData: cleanHealthData
      });

      if (saveRes && !saveRes.success) {
        console.error('[Tenant Health]: Gagal update ke database Firestore:', saveRes.error);
        setHealthError('Analisis selesai namun gagal menyimpan ke database: ' + saveRes.error);
      } else {
        console.log('[Tenant Health]: Hasil analisis AI berhasil disimpan permanen ke database Firestore untuk tenant:', tenant.id);
      }
    } catch (err: any) {
      console.error('AI Health Score Error:', err);
      setHealthError(err.message || 'Terjadi kesalahan saat memanggil AI');
    } finally {
      setIsAnalyzingHealth(false);
    }
  };

  // PERUBAHAN FASE 3: Fungsi Approval
  const handleApproveTenant = async () => {
    if (!tenant || !tenant.id) return;
    if (window.confirm(`Aktifkan ${tenant.name} sebagai Tenant Resmi di Ekosistem?`)) {
      await updateTenant(tenant.id, { status: 'Aktif' });
      alert('Tenant berhasil disetujui & diaktifkan!');
      onClose(); // Tutup drawer setelah approve
    }
  };

  if (!isOpen || !tenant) return null;
  const tenantInvoices = invoices.filter(inv => inv.customerName === tenant.name);
  const latestKPI = kpis.length > 0 ? kpis[0] : null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity animate-in fade-in" onClick={onClose} />
      
      {/* Container Drawer: Two Pane Layout di Desktop */}
      <div className="fixed inset-y-0 right-0 w-full md:max-w-5xl bg-white shadow-2xl z-50 flex flex-col md:flex-row transform transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] translate-x-0 animate-in slide-in-from-right overflow-hidden">
        
        {/* ==================================================== */}
        {/* PANE KIRI: SIDEBAR PROFIL & NAVIGASI (30% WIDTH) */}
        {/* ==================================================== */}
        <div className="w-full md:w-80 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 shrink-0 flex flex-col z-10">
          
          {/* Header & Profil Ringkas */}
          <div className="p-6 md:p-8 relative">
            <button onClick={onClose} className="md:hidden absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
            
            <div className="flex items-center md:flex-col md:items-start gap-4 md:gap-5">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                {tenant.logoUrl ? (
                  <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-contain p-2" /> 
                ) : ( 
                  <span className="text-2xl md:text-3xl font-light text-slate-300">{tenant.name.charAt(0)}</span>
                )}
                {tenant.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white" title="Verified by KST">
                    <ShieldCheck size={12} />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight leading-tight">{tenant.name}</h1>
                  {tenant.currentHealthScore === 'Healthy' && <div className="w-2 h-2 rounded-full bg-emerald-500" title="Status Sehat" />}
                  {tenant.currentHealthScore === 'Warning' && <div className="w-2 h-2 rounded-full bg-amber-500" title="Status Waspada" />}
                  {tenant.currentHealthScore === 'Critical' && <div className="w-2 h-2 rounded-full bg-rose-500" title="Berisiko" />}
                </div>
                <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5"><User size={14}/> {tenant.ownerName}</p>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[10px] font-medium text-slate-600 bg-slate-200/50 px-2 py-1 rounded uppercase tracking-wider">{tenant.sector}</span>
                  <span className="text-[10px] font-medium text-slate-600 bg-slate-200/50 px-2 py-1 rounded uppercase tracking-wider">{tenant.pipelineStage || 'Inkubasi'}</span>
                </div>
              </div>
            </div>

            {/* Aksi Cepat (Email/WA) */}
            <div className="flex gap-3 mt-6">
              {tenant.contact && <a href={`https://wa.me/${tenant.contact}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"><Phone size={14}/> {tenant.contact}</a>}
            </div>
            
            {/* PERUBAHAN FASE 3: Tombol Approval Admin */}
            {tenant.status === 'Menunggu Review' && (
              <button 
                onClick={handleApproveTenant}
                className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} /> Terima & Aktifkan Tenant
              </button>
            )}

            {tenant.elevatorPitch && (
              <p className="text-sm text-slate-600 italic mt-5 leading-relaxed font-light border-l border-slate-300 pl-3">"{tenant.elevatorPitch}"</p>
            )}
          </div>

          {/* Menu Navigasi (Desktop: Vertikal, Mobile: Horizontal Scroll) */}
          <nav className="flex md:flex-col overflow-x-auto md:overflow-visible px-4 pb-4 md:pb-8 md:px-6 gap-1 md:gap-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {TABS.map(tab => {
              // Sembunyikan tab kurasi jika tenant tidak punya data kurasi
              if (tab.id === 'curation' && !tenant.aiCurationData) return null;

              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)} 
                  className={`flex items-center gap-3 px-4 py-3 md:py-2.5 rounded-xl md:rounded-lg text-sm transition-all whitespace-nowrap outline-none
                    ${isActive 
                      ? 'bg-slate-900 text-white font-medium shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                  {tab.label}
                  {/* Badge untuk tab kurasi */}
                  {tab.id === 'curation' && tenant.status === 'Menunggu Review' && (
                    <span className="w-2 h-2 rounded-full bg-red-500 ml-auto animate-pulse"></span>
                  )}
                  {/* Badge untuk tab health score */}
                  {tab.id === 'health_ai' && (
                    <span className={`w-2 h-2 rounded-full ml-auto ${
                      tenant.currentHealthScore === 'Healthy'
                        ? 'bg-emerald-500'
                        : tenant.currentHealthScore === 'Warning'
                        ? 'bg-amber-500'
                        : tenant.currentHealthScore === 'Critical'
                        ? 'bg-rose-500'
                        : 'bg-slate-300'
                    }`} />
                  )}
                </button>
              );
            })}
          </nav>
          
          <div className="hidden md:block mt-auto p-6 border-t border-slate-200/60">
            <button onClick={onClose} className="w-full flex justify-center items-center gap-2 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={16}/> Tutup Drawer
            </button>
          </div>
        </div>


        {/* ==================================================== */}
        {/* PANE KANAN: AREA KONTEN (70% WIDTH) */}
        {/* ==================================================== */}
        <div className="flex-1 bg-white overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="p-6 md:p-10 max-w-3xl mx-auto pb-24">
            
            {/* Header Tab Dinamis */}
            <div className="mb-10 animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-2xl md:text-3xl font-light tracking-tight text-slate-900">{TABS.find(t => t.id === activeTab)?.label}</h2>
            </div>

            {/* ---------------------------------------------------- */}
            {/* TAB: HASIL KURASI AI (FASE 3) */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'curation' && tenant.aiCurationData && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* 1. Score & Readiness Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Smart Score</p>
                      <div className="flex items-end gap-3 mb-2">
                         <span className="text-6xl font-black leading-none">{tenant.aiCurationData.totalScore}</span>
                         <span className="text-slate-400 font-medium pb-2">/ 100</span>
                      </div>
                   </div>

                   <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 flex flex-col justify-center">
                     <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2"><ShieldCheck size={14} /> Readiness Level</p>
                     <span className="text-2xl font-black text-emerald-900">{tenant.aiCurationData.readinessLevel}</span>
                   </div>
                </div>

                {/* 2. Breakdown Penilaian */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Dimensi Kelayakan</h3>
                   <div className="space-y-5">
                     {[
                       { label: 'Kualitas & Produksi', score: tenant.aiCurationData.breakdown?.kualitas, color: 'bg-blue-500' },
                       { label: 'Branding & Visual', score: tenant.aiCurationData.breakdown?.branding, color: 'bg-emerald-500' },
                       { label: 'Legalitas & Sertifikasi', score: tenant.aiCurationData.breakdown?.legalitas, color: 'bg-amber-500' },
                       { label: 'Potensi Pasar & Ekspor', score: tenant.aiCurationData.breakdown?.pasar, color: 'bg-indigo-500' }
                     ].map(item => (
                       <div key={item.label}>
                         <div className="flex justify-between text-xs font-bold mb-1.5">
                           <span className="text-slate-700">{item.label}</span>
                           <span className="text-slate-500">{item.score || 0}%</span>
                         </div>
                         <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                           <div className={`${item.color} h-2.5 rounded-full`} style={{ width: `${item.score || 0}%` }}></div>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                {/* 3. AI Insights */}
                {tenant.aiCurationData.recommendations && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-100 shadow-sm">
                     <h3 className="text-sm font-black text-amber-900 mb-6 flex items-center gap-2">
                       <Sparkles className="text-amber-500" size={18} /> AI Strategic Recommendations
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/60 p-4 rounded-2xl border border-amber-200/50">
                           <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Target size={12}/> Target Pasar</h4>
                           <p className="text-sm text-slate-700 font-medium">{tenant.aiCurationData.recommendations.targetMarket}</p>
                        </div>
                        <div className="bg-white/60 p-4 rounded-2xl border border-amber-200/50">
                           <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Package size={12}/> Inovasi Kemasan</h4>
                           <p className="text-sm text-slate-700 font-medium">{tenant.aiCurationData.recommendations.packagingImprovement}</p>
                        </div>
                        <div className="bg-white/60 p-4 rounded-2xl border border-amber-200/50">
                           <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Globe size={12}/> Distribusi</h4>
                           <p className="text-sm text-slate-700 font-medium">{tenant.aiCurationData.recommendations.distributionChannel}</p>
                        </div>
                        <div className="bg-white/60 p-4 rounded-2xl border border-amber-200/50">
                           <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1 flex items-center gap-1.5"><ShoppingBag size={12}/> Harga & Branding</h4>
                           <p className="text-sm text-slate-700 font-medium">{tenant.aiCurationData.recommendations.idealPrice} {tenant.aiCurationData.recommendations.brandingStrategy}</p>
                        </div>
                     </div>
                  </div>
                )}

                {/* 4. Raw Self-Assessment Data */}
                {tenant.selfAssessment && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Data Self-Assessment UMKM</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                       <div>
                         <p className="text-slate-500 font-light mb-0.5">Kapasitas Produksi</p>
                         <p className="font-semibold text-slate-900">{tenant.selfAssessment.kapasitas}</p>
                       </div>
                       <div>
                         <p className="text-slate-500 font-light mb-0.5">Omset Bulanan</p>
                         <p className="font-semibold text-slate-900">{tenant.selfAssessment.omset}</p>
                       </div>
                       <div>
                         <p className="text-slate-500 font-light mb-0.5">Legalitas Dimiliki</p>
                         <p className="font-semibold text-slate-900">{(tenant.selfAssessment.legalitas || []).join(', ') || '-'}</p>
                       </div>
                       <div>
                         <p className="text-slate-500 font-light mb-0.5">Kanal Penjualan</p>
                         <p className="font-semibold text-slate-900">{(tenant.selfAssessment.channels || []).join(', ') || '-'}</p>
                       </div>
                       <div>
                         <p className="text-slate-500 font-light mb-0.5">Kesiapan Ekspor</p>
                         <p className="font-semibold text-slate-900">{tenant.selfAssessment.pernahEkspor === 'Ya' ? 'Pernah Ekspor' : 'Belum Pernah'}</p>
                       </div>
                       <div>
                         <p className="text-slate-500 font-light mb-0.5">Sistem Produksi</p>
                         <p className="font-semibold text-slate-900">{tenant.selfAssessment.sistemProduksi}</p>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: KESEHATAN BISNIS AI (CLARIO FINANCIAL PRO) */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'health_ai' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header Action Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-400/20 flex items-center gap-1">
                        <Sparkles size={11} /> Clario DeepSeek Financial Pro
                      </span>
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-white">Business Health Audit</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-md">
                      Evaluasi kesiapan komersial, kesehatan finansial, dan stabilitas runway berdasarkan data operasional tenant.
                    </p>
                  </div>

                  <div className="relative z-10 shrink-0">
                    <button
                      type="button"
                      onClick={handleAnalyzeHealth}
                      disabled={isAnalyzingHealth}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 active:scale-95"
                    >
                      {isAnalyzingHealth ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menganalisis...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>{(localHealthData || tenant.aiHealthData) ? 'Analisis Ulang AI' : 'Jalankan Audit AI'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {healthError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{healthError}</span>
                  </div>
                )}

                {/* Content: When AI Health Data exists */}
                {(() => {
                  const activeHealthData = localHealthData || tenant.aiHealthData;
                  if (!activeHealthData) {
                    return (
                      /* Empty state when no audit has been performed */
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                          <Activity size={28} />
                        </div>
                        <h4 className="text-base font-black text-slate-800">Belum Ada Audit Kesehatan AI</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                          Jalankan evaluasi komprehensif menggunakan model Clario DeepSeek Financial Pro untuk mengukur keberlanjutan operasional, kestabilan arus kas, dan kekuatan unit ekonomi startup binaan ini.
                        </p>
                        <button
                          type="button"
                          onClick={handleAnalyzeHealth}
                          disabled={isAnalyzingHealth}
                          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isAnalyzingHealth ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Menganalisis Data Tenant...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} />
                              <span>Jalankan Audit AI Sekarang</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-8">
                      {/* 0. Executive Narrative Summary (from AI Senior Partner) */}
                      {activeHealthData.summaryNarrative && (
                        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-7 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
                          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="p-1.5 rounded-xl bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                                <Sparkles size={14} />
                              </span>
                              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-200">
                                Executive Auditor Synthesis
                              </h4>
                            </div>
                            <p className="text-sm text-slate-200 font-normal leading-relaxed whitespace-pre-line">
                              {activeHealthData.summaryNarrative}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 1. Overview Score & Health Status */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                          <div>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Skor Kesehatan Bisnis</p>
                            <div className="flex items-baseline gap-2 mt-2">
                              <span className="text-5xl font-black text-slate-900 tracking-tight">{activeHealthData.healthScore ?? 0}</span>
                              <span className="text-slate-400 font-bold text-sm">/ 100</span>
                            </div>
                          </div>
                          {activeHealthData.analyzedAt && (
                            <p className="text-[10px] text-slate-400 mt-4">
                              Audit: {new Date(activeHealthData.analyzedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>

                        <div className={`rounded-3xl p-6 border shadow-xs flex flex-col justify-between ${
                          activeHealthData.healthStatus === 'Healthy'
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : activeHealthData.healthStatus === 'Warning'
                            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                            : 'bg-rose-50/70 border-rose-200 text-rose-900'
                        }`}>
                          <div>
                            <p className="font-bold text-[10px] uppercase tracking-widest opacity-70 mb-1">Status Keberlangsungan</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Activity className="w-6 h-6 shrink-0" />
                              <span className="text-2xl font-black tracking-tight">{activeHealthData.healthStatus}</span>
                            </div>
                          </div>
                          <p className="text-[11px] font-medium opacity-80 mt-4 leading-relaxed">
                            {activeHealthData.healthStatus === 'Healthy' && 'Fundamental bisnis kokoh dengan arus kas atau traksi pasar positif.'}
                            {activeHealthData.healthStatus === 'Warning' && 'Perlu perhatian khusus pada efisiensi modal dan akselerasi penjualan.'}
                            {activeHealthData.healthStatus === 'Critical' && 'Berisiko tinggi, butuh intervensi intensif dari mentor atau pivot strategi.'}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                          <div>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Tahap & Segmen</p>
                            <p className="text-lg font-black text-slate-800 mt-2">{tenant.pipelineStage || 'Inkubasi'}</p>
                            <p className="text-xs text-slate-500 font-medium">{tenant.segment || 'StartUp'} • {tenant.fundingStage || 'Bootstrapped'}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                            <span>Ukuran Tim: <strong>{tenant.teamSize || 1} orang</strong></span>
                            <span>Legalitas: <strong>{tenant.legalEntity || '-'}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Radar Metrics (5 Dimensi Lengkap) */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <LineChart size={15} className="text-indigo-600" />
                            Dimensi Fundamental Bisnis (5 Sumbu)
                          </h4>
                          <span className="text-[10px] text-slate-400 font-semibold">Skor 0 - 100</span>
                        </div>

                        {activeHealthData.radarMetrics && activeHealthData.radarMetrics.length > 0 ? (
                          <div className="space-y-4">
                            {activeHealthData.radarMetrics.map((rm: any, idx: number) => {
                              const colors = [
                                'bg-blue-600',
                                'bg-emerald-600',
                                'bg-indigo-600',
                                'bg-violet-600',
                                'bg-amber-600'
                              ];
                              const barColor = colors[idx % colors.length];
                              return (
                                <div key={idx}>
                                  <div className="flex justify-between items-baseline text-xs font-bold mb-1">
                                    <span className="text-slate-800 font-semibold">{rm.label}</span>
                                    <span className="font-mono text-slate-900">{rm.score}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-1">
                                    <div
                                      className={`${barColor} h-2.5 rounded-full transition-all duration-700`}
                                      style={{ width: `${rm.score}%` }}
                                    />
                                  </div>
                                  {rm.description && (
                                    <p className="text-[11px] text-slate-500 font-normal leading-snug">{rm.description}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* Fallback jika format lama 3 sumbu */
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-xs font-bold mb-1.5">
                                <span className="text-slate-700 flex items-center gap-1.5"><DollarSign size={13} className="text-blue-600" /> Keberlanjutan Finansial (Runway & Omset)</span>
                                <span className="font-mono text-slate-900">{activeHealthData.financialSustainability ?? 0}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${activeHealthData.financialSustainability ?? 0}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs font-bold mb-1.5">
                                <span className="text-slate-700 flex items-center gap-1.5"><TrendingUp size={13} className="text-indigo-600" /> Traksi Pasar & Validasi Produk</span>
                                <span className="font-mono text-slate-900">{activeHealthData.marketTraction ?? 0}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${activeHealthData.marketTraction ?? 0}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs font-bold mb-1.5">
                                <span className="text-slate-700 flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-600" /> Eksekusi Tim & Kelembagaan</span>
                                <span className="font-mono text-slate-900">{activeHealthData.teamExecution ?? 0}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${activeHealthData.teamExecution ?? 0}%` }} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. Comprehensive SWOT Matrix (Ala ai-curation-app) */}
                      {activeHealthData.swot ? (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Target size={15} className="text-indigo-600" />
                            Matriks Analisis SWOT Komprehensif
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Strengths */}
                            <div className="bg-emerald-50/60 rounded-3xl p-6 border border-emerald-200/70 shadow-2xs">
                              <h5 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-3.5 flex items-center gap-2">
                                <CheckCircle2 size={15} className="text-emerald-600" /> Strengths (Kekuatan Riil)
                              </h5>
                              <ul className="space-y-2">
                                {(activeHealthData.swot.strengths || []).map((s: string, idx: number) => (
                                  <li key={idx} className="text-xs text-emerald-950 font-medium leading-relaxed flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Weaknesses */}
                            <div className="bg-rose-50/60 rounded-3xl p-6 border border-rose-200/70 shadow-2xs">
                              <h5 className="text-xs font-black text-rose-900 uppercase tracking-wider mb-3.5 flex items-center gap-2">
                                <AlertTriangle size={15} className="text-rose-600" /> Weaknesses (Kelemahan & Titik Lemah)
                              </h5>
                              <ul className="space-y-2">
                                {(activeHealthData.swot.weaknesses || []).map((w: string, idx: number) => (
                                  <li key={idx} className="text-xs text-rose-950 font-medium leading-relaxed flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                    <span>{w}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Opportunities */}
                            <div className="bg-blue-50/60 rounded-3xl p-6 border border-blue-200/70 shadow-2xs">
                              <h5 className="text-xs font-black text-blue-900 uppercase tracking-wider mb-3.5 flex items-center gap-2">
                                <TrendingUp size={15} className="text-blue-600" /> Opportunities (Peluang Kawasan Solo Technopark)
                              </h5>
                              <ul className="space-y-2">
                                {(activeHealthData.swot.opportunities || []).map((o: string, idx: number) => (
                                  <li key={idx} className="text-xs text-blue-950 font-medium leading-relaxed flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                    <span>{o}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Threats */}
                            <div className="bg-amber-50/60 rounded-3xl p-6 border border-amber-200/70 shadow-2xs">
                              <h5 className="text-xs font-black text-amber-900 uppercase tracking-wider mb-3.5 flex items-center gap-2">
                                <Flame size={15} className="text-amber-600" /> Threats (Risiko & Tekanan Pasar)
                              </h5>
                              <ul className="space-y-2">
                                {(activeHealthData.swot.threats || []).map((t: string, idx: number) => (
                                  <li key={idx} className="text-xs text-amber-950 font-medium leading-relaxed flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                    <span>{t}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Fallback 2 Kolom */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100 shadow-xs">
                            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <CheckCircle2 size={15} className="text-emerald-600" /> Keunggulan Kompetitif
                            </h4>
                            <ul className="space-y-2.5">
                              {(activeHealthData.keyStrengths || []).map((str: string, idx: number) => (
                                <li key={idx} className="text-xs text-emerald-950 font-medium leading-relaxed flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-rose-50/50 rounded-3xl p-6 border border-rose-100 shadow-xs">
                            <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <AlertTriangle size={15} className="text-rose-600" /> Titik Kritis & Hambatan
                            </h4>
                            <ul className="space-y-2.5">
                              {(activeHealthData.riskFactors || []).map((risk: string, idx: number) => (
                                <li key={idx} className="text-xs text-rose-950 font-medium leading-relaxed flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                  <span>{risk}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* 4. Tactical Action Roadmap (30 / 90 / 180 Hari) */}
                      {activeHealthData.tacticalRoadmap && activeHealthData.tacticalRoadmap.length > 0 ? (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={15} className="text-indigo-600" />
                            Tactical Action Roadmap (Rencana Aksi Bertahap)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {activeHealthData.tacticalRoadmap.map((step: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-gradient-to-b from-white to-slate-50/80 rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-3">
                                    <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-black text-[10px] tracking-wider border border-indigo-100">
                                      {step.timeframe}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                      step.priority === 'High'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                    }`}>
                                      {step.priority || 'Normal'}
                                    </span>
                                  </div>
                                  <h5 className="text-sm font-black text-slate-900 mb-1">{step.title}</h5>
                                  <p className="text-xs text-slate-600 leading-relaxed">{step.task}</p>
                                </div>
                                {step.focusArea && (
                                  <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-semibold">
                                    Area: <span className="text-slate-700">{step.focusArea}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Fallback Actionable Recommendations */
                        <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 rounded-3xl p-6 border border-indigo-100 shadow-xs">
                          <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Target size={15} className="text-indigo-600" /> Rekomendasi Aksi Nyata Inkubasi
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {(activeHealthData.actionableRecommendations || []).map((rec: string, idx: number) => (
                              <div key={idx} className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-2xs">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] mb-2">
                                  Langkah #{idx + 1}
                                </span>
                                <p className="text-xs text-slate-700 font-medium leading-relaxed">{rec}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  );
                })()}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: DASHBOARD (Overview & KPI) */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'dashboard' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                
                {/* Survival Metrics (Top 3) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Flame size={12}/> Burn Rate (Avg/Bulan)</p>
                    <p className="text-3xl font-light text-slate-900 tracking-tight">{latestKPI?.burnRate ? formatRupiah(latestKPI.burnRate) : 'Rp 0'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Hourglass size={12}/> Runway Tersisa</p>
                    <p className="text-3xl font-light text-slate-900 tracking-tight">{latestKPI?.runwayMonths || 0} <span className="text-base text-slate-400">Bln</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><DollarSign size={12}/> Total Funding</p>
                    <p className="text-3xl font-light text-slate-900 tracking-tight">{latestKPI?.fundingAcquired ? formatRupiah(latestKPI.fundingAcquired) : 'Rp 0'}</p>
                  </div>
                </div>

                {/* Cap Table (Sleek Minimalist Bar) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-900">Kepemilikan Saham (Cap Table)</h3>
                  </div>
                  {!tenant.capTable || tenant.capTable.length === 0 ? (
                    <p className="text-sm font-light text-slate-500 italic">100% Kepemilikan Founder (Bootstrapped).</p>
                  ) : (
                    <div>
                      {/* Bar Visual */}
                      <div className="w-full h-1.5 rounded-full overflow-hidden flex mb-4 bg-slate-100">
                        {tenant.capTable.map((entry, idx) => (
                          <div key={entry.id} title={`${entry.name} - ${entry.ownershipPercentage}%`} className={`h-full ${getCapTableColor(entry.type, idx)} transition-opacity hover:opacity-80`} style={{ width: `${entry.ownershipPercentage}%` }} />
                        ))}
                      </div>
                      {/* Legend List */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {tenant.capTable.map((entry, idx) => (
                          <div key={entry.id} className="flex items-start gap-2.5">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getCapTableColor(entry.type, idx)}`} />
                            <div>
                              <p className="text-sm font-medium text-slate-900 leading-none mb-1">{entry.name}</p>
                              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{entry.ownershipPercentage}% • {entry.type}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Riwayat Laporan KPI */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-sm font-semibold text-slate-900">Riwayat Rapor Kinerja</h3>
                    <button onClick={() => setIsAddingKPI(!isAddingKPI)} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                      {isAddingKPI ? 'Batal' : '+ Input KPI Baru'}
                    </button>
                  </div>

                  {/* Form Tambah KPI (Slide Down Minimalist) */}
                  {isAddingKPI && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Periode (Cth: Q1 2024)</label>
                          <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400" value={newKPI.period} onChange={e => setNewKPI({...newKPI, period: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Status Kesehatan</label>
                          <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400" value={newKPI.healthStatus} onChange={e => setNewKPI({...newKPI, healthStatus: e.target.value as any})}>
                            <option value="Healthy">Sehat / Berkembang</option><option value="Warning">Stagnan / Waspada</option><option value="Critical">Berisiko Tinggi</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Avg Burn Rate (Rp)</label>
                          <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none" value={newKPI.burnRate || ''} onChange={e => setNewKPI({...newKPI, burnRate: Number(e.target.value)})} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Runway (Bulan)</label>
                          <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none" value={newKPI.runwayMonths || ''} onChange={e => setNewKPI({...newKPI, runwayMonths: Number(e.target.value)})} />
                        </div>
                      </div>
                      
                      {/* Metric Kustom Form */}
                      <div className="border-t border-slate-200 pt-4 mb-6">
                         <label className="block text-xs font-semibold text-slate-900 mb-2">Metrik Dinamis (Traction, Users, dll)</label>
                         <div className="flex gap-2 items-center mb-3">
                           <input type="text" placeholder="Nama Metrik" className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" value={metricInput.name} onChange={e => setMetricInput({...metricInput, name: e.target.value})} />
                           <select className="w-20 px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm" value={metricInput.unit} onChange={e => setMetricInput({...metricInput, unit: e.target.value as any})}>
                             <option value="Rp">Rp</option><option value="USD">USD</option><option value="Users">Users</option><option value="%">%</option><option value="Item">Item</option>
                           </select>
                           <input type="number" placeholder="Aktual" className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" value={metricInput.actualValue || ''} onChange={e => setMetricInput({...metricInput, actualValue: Number(e.target.value)})} />
                           <button onClick={handleAddMetricToKPI} className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium">Add</button>
                         </div>
                         {newKPI.metrics?.map(m => (
                           <div key={m.id} className="flex justify-between items-center text-sm py-1.5 border-b border-slate-100 last:border-0">
                             <span className="text-slate-600">{m.name}: <strong className="text-slate-900">{m.actualValue} {m.unit}</strong></span>
                             <button onClick={() => handleRemoveMetricFromKPI(m.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                           </div>
                         ))}
                      </div>

                      <div className="flex justify-end">
                         <button onClick={() => { if(newKPI.period) { addKPI.mutate(newKPI as any); setIsAddingKPI(false); } }} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors">
                           Simpan Rapor
                         </button>
                      </div>
                    </div>
                  )}

                  {/* List Riwayat KPI */}
                  {kpis.length === 0 ? (
                    <p className="text-sm font-light text-slate-500 italic">Belum ada rapor kinerja yang dicatat.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {kpis.map(kpi => {
                        const displayMetrics: DynamicMetric[] = kpi.metrics && kpi.metrics.length > 0 ? kpi.metrics : [
                          ...(kpi.revenue ? [{ id: 'leg-rev', name: 'Total Omzet', unit: 'Rp', actualValue: kpi.revenue } as DynamicMetric] : []),
                          ...(kpi.activeUsers ? [{ id: 'leg-usr', name: 'Pelanggan Aktif', unit: 'Users', actualValue: kpi.activeUsers } as DynamicMetric] : [])
                        ];

                        return (
                          <div key={kpi.id} className="py-5 group relative">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <h4 className="text-base font-semibold text-slate-900">{kpi.period}</h4>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                  kpi.healthStatus === 'Healthy' ? 'bg-emerald-100 text-emerald-700' : 
                                  kpi.healthStatus === 'Warning' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                }`}>{kpi.healthStatus}</span>
                              </div>
                              <button onClick={() => removeKPI.mutate(kpi.id!)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"><Trash2 size={16}/></button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                              {/* Survival Snapshot */}
                              <div className="flex items-center justify-between text-sm py-1 border-b border-slate-50">
                                <span className="text-slate-500">Burn Rate</span>
                                <span className="font-medium text-slate-900">{formatRupiah(kpi.burnRate || 0)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm py-1 border-b border-slate-50">
                                <span className="text-slate-500">Runway</span>
                                <span className="font-medium text-slate-900">{kpi.runwayMonths || 0} Bln</span>
                              </div>
                              
                              {/* Dinamis Snapshot */}
                              {displayMetrics.map(m => (
                                <div key={m.id} className="flex items-center justify-between text-sm py-1 border-b border-slate-50">
                                  <span className="text-slate-500 truncate pr-4">{m.name}</span>
                                  <span className="font-medium text-slate-900 shrink-0">{m.unit === 'Rp' ? formatRupiah(m.actualValue) : m.actualValue} {m.unit !== 'Rp' && m.unit}</span>
                                </div>
                              ))}
                            </div>
                            
                            {(kpi.topAchievements || kpi.currentBottlenecks) && (
                              <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                                {kpi.topAchievements && <p className="text-sm font-light text-slate-600"><strong className="font-medium text-slate-900">Achievement:</strong> {kpi.topAchievements}</p>}
                                {kpi.currentBottlenecks && <p className="text-sm font-light text-slate-600"><strong className="font-medium text-slate-900">Bottleneck:</strong> {kpi.currentBottlenecks}</p>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: KURIKULUM (Timeline Minimalis) */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'curriculum' && (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-baseline justify-between mb-8">
                  <p className="text-sm text-slate-500 font-light">Progres pencapaian validasi bisnis tenant.</p>
                  <span className="text-2xl font-light text-slate-900">{progressPercent}%</span>
                </div>

                <div className="relative pl-3">
                  {/* Garis Vertikal Latar */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200 z-0"></div>
                  
                  <div className="space-y-6">
                    {curriculumItems.map((item, index) => {
                      const isDone = item.isCompleted;
                      return (
                        <div key={item.id} className="relative z-10 flex items-start gap-5 group cursor-pointer" onClick={() => handleToggleCurriculum(item.id, isDone)}>
                          <div className={`mt-1 w-5 h-5 rounded-full border-[3px] flex-shrink-0 transition-all duration-300 flex items-center justify-center 
                            ${isDone ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-300 group-hover:border-slate-500'}`}
                          >
                            {isDone && <CheckCircle2 size={12} className="text-white" />}
                          </div>
                          <div>
                            <p className={`text-base font-medium transition-colors ${isDone ? 'text-slate-900 line-through opacity-60' : 'text-slate-900'}`}>
                              {item.title}
                            </p>
                            {isDone && item.completedAt && (
                              <p className="text-xs text-slate-500 mt-0.5 font-light">Selesai: {new Date(item.completedAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: MENTORING & LOGBOOK */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'mentoring' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                
                {/* Jadwal Sesi */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-sm font-semibold text-slate-900">Jadwal Mentoring</h3>
                    <button onClick={() => setIsBookingSession(!isBookingSession)} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                      {isBookingSession ? 'Batal' : '+ Jadwal Baru'}
                    </button>
                  </div>

                  {isBookingSession && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                        <div className="flex gap-2">
                           <input type="date" className="w-1/2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} />
                           <input type="time" className="w-1/2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" value={newSession.time} onChange={e => setNewSession({...newSession, time: e.target.value})} />
                        </div>
                        <input type="text" placeholder="Nama Mentor" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" value={newSession.mentorName || tenant.mentor || ''} onChange={e => setNewSession({...newSession, mentorName: e.target.value})} />
                        <div className="sm:col-span-2">
                          <input type="text" placeholder="Topik Diskusi" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" value={newSession.topic} onChange={e => setNewSession({...newSession, topic: e.target.value})} />
                        </div>
                      </div>
                      <div className="flex justify-end">
                         <button onClick={() => { if(newSession.topic && newSession.mentorName) { addSession.mutate({ ...newSession, mentorName: newSession.mentorName || 'Mentor' } as MentoringSession); setIsBookingSession(false); } }} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors">Simpan Jadwal</button>
                      </div>
                    </div>
                  )}

                  {sessions.length === 0 ? (
                    <p className="text-sm font-light text-slate-500 italic">Belum ada jadwal sesi konsultasi.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {sessions.map(session => (
                        <div key={session.id} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors group">
                           <div className="flex justify-between items-start mb-2">
                             <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{new Date(session.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {session.time}</div>
                             <button onClick={() => removeSession.mutate(session.id!)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                           </div>
                           <p className="text-base font-medium text-slate-900 leading-tight mb-2">{session.topic}</p>
                           <p className="text-sm text-slate-500 font-light mb-4 flex items-center gap-1.5"><Users size={12}/> {session.mentorName}</p>
                           
                           <select value={session.status} onChange={(e) => updateSession.mutate({ sessionId: session.id!, data: { status: e.target.value as any } })} className={`w-full text-xs font-medium px-2 py-1.5 rounded-lg outline-none cursor-pointer ${session.status === 'SCHEDULED' ? 'bg-slate-100 text-slate-700' : session.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              <option value="SCHEDULED">MENDATANG</option>
                              <option value="COMPLETED">SELESAI</option>
                              <option value="CANCELLED">BATAL</option>
                           </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Logbook Timeline */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
                    <h3 className="text-sm font-semibold text-slate-900">Logbook / Jurnal</h3>
                    <button onClick={() => setIsAddingMonev(!isAddingMonev)} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                      {isAddingMonev ? 'Batal' : '+ Tulis Jurnal'}
                    </button>
                  </div>

                  {isAddingMonev && (
                    <div className="border-l-2 border-slate-900 pl-4 mb-8 py-1 animate-in slide-in-from-top-2">
                      <div className="flex gap-3 mb-3">
                        <input type="date" className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none" value={newMonev.date} onChange={e => setNewMonev({...newMonev, date: e.target.value})} />
                        <input type="text" placeholder="Judul Catatan..." className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none" value={newMonev.title} onChange={e => setNewMonev({...newMonev, title: e.target.value})} />
                      </div>
                      <textarea rows={3} placeholder="Isi evaluasi..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none resize-none mb-2" value={newMonev.description} onChange={e => setNewMonev({...newMonev, description: e.target.value})} />
                      <button onClick={() => { if(newMonev.title) { addMonev.mutate({ ...newMonev, evaluator: tenant.mentor || 'Mentor' }); setIsAddingMonev(false); setNewMonev({ date: new Date().toISOString().split('T')[0], title: '', description: '' }); } }} className="px-4 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md">Simpan Jurnal</button>
                    </div>
                  )}

                  {monevs.length === 0 ? (
                     <p className="text-sm font-light text-slate-500 italic">Belum ada catatan jurnal.</p>
                  ) : (
                    <div className="relative pl-3 space-y-6">
                      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200 z-0"></div>
                      {monevs.map(log => (
                        <div key={log.id} className="relative z-10 flex items-start gap-4 group">
                          <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-slate-900 transition-colors flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex justify-between items-baseline mb-1">
                              <p className="text-sm font-semibold text-slate-900">{log.title}</p>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-medium text-slate-400">{new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                <button onClick={() => removeMonev.mutate(log.id!)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"><Trash2 size={12}/></button>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 font-light leading-relaxed whitespace-pre-wrap">{log.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: VDR (Data Room) - Clean Table View */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'vdr' && (
              <div className="animate-in fade-in duration-500">
                <p className="text-sm text-slate-500 font-light mb-6">Pusat dokumen legal dan aset fundamental startup.</p>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    
                    {/* Pitch Deck */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${tenant.pitchDeckUrl ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}><FileText size={18}/></div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Pitch Deck Investor</p>
                          <p className="text-xs text-slate-500 font-light">{tenant.pitchDeckUrl ? 'Diunggah & Tersedia' : 'Belum Tersedia'}</p>
                        </div>
                      </div>
                      {tenant.pitchDeckUrl && <a href={tenant.pitchDeckUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">Download</a>}
                    </div>

                    {/* Akta */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${tenant.vdr?.aktaPendirianUrl ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}><Building2 size={18}/></div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Akta Pendirian (PT/CV)</p>
                          <p className="text-xs text-slate-500 font-light">{tenant.vdr?.aktaPendirianUrl ? 'Diunggah & Tersedia' : 'Belum Tersedia'}</p>
                        </div>
                      </div>
                      {tenant.vdr?.aktaPendirianUrl && <a href={tenant.vdr.aktaPendirianUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">Download</a>}
                    </div>

                    {/* SK Kemenkumham */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${tenant.vdr?.skKemenkumhamUrl ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}><ShieldCheck size={18}/></div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">SK Kemenkumham</p>
                          <p className="text-xs text-slate-500 font-light">{tenant.vdr?.skKemenkumhamUrl ? 'Diunggah & Tersedia' : 'Belum Tersedia'}</p>
                        </div>
                      </div>
                      {tenant.vdr?.skKemenkumhamUrl && <a href={tenant.vdr.skKemenkumhamUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">Download</a>}
                    </div>

                    {/* FinMod */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${tenant.vdr?.financialModelUrl ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}><BarChart2 size={18}/></div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Financial Model</p>
                          <p className="text-xs text-slate-500 font-light">{tenant.vdr?.financialModelUrl ? 'Diunggah & Tersedia' : 'Belum Tersedia'}</p>
                        </div>
                      </div>
                      {tenant.vdr?.financialModelUrl && <a href={tenant.vdr.financialModelUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">Download</a>}
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: PORTOFOLIO (Growth) */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'portfolio' && (
              <div className="animate-in fade-in duration-500">
                <p className="text-sm text-slate-500 font-light mb-8">Katalog layanan dan produk yang telah dirilis.</p>

                {products.length === 0 ? (
                  <p className="text-sm font-light text-slate-500 italic">Belum ada portofolio yang ditambahkan.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {products.map(product => (
                      <div key={product.id} className="group">
                        <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden mb-3 border border-slate-200/60">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><Package size={32}/></div>
                          )}
                        </div>
                        <div className="flex items-baseline justify-between gap-2">
                          <h4 className="text-base font-semibold text-slate-900 truncate">{product.name}</h4>
                          {product.category && <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{product.category}</span>}
                        </div>
                        <p className="text-sm text-slate-500 font-light line-clamp-2 mt-1">{product.description}</p>
                        {product.productUrl && (
                          <a href={product.productUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-600 flex items-center gap-1 mt-2 hover:underline w-fit">Visit Link <ArrowUpRight size={12}/></a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: FINANCE & EXIT */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'finance' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                
                {/* Exit Status */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Status Exit Alumni</h3>
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="w-full sm:w-1/3">
                      <label className="block text-xs text-slate-500 font-medium mb-1">Status</label>
                      <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none" value={exitData.status} onChange={(e) => setExitData({...exitData, status: e.target.value})}>
                        <option value="Belum Lulus">Belum Lulus (Aktif)</option>
                        <option value="Berkembang Mandiri">Berkembang Mandiri</option>
                        <option value="Diakuisisi">Diakuisisi (M&A)</option>
                        <option value="IPO">IPO / Go Public</option>
                        <option value="Gagal/Tutup">Gagal / Tutup</option>
                      </select>
                    </div>
                    <div className="w-full sm:flex-1">
                      <label className="block text-xs text-slate-500 font-medium mb-1">Valuasi Saat Exit (Rp)</label>
                      <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none" placeholder="Opsional" value={exitData.valuation || ''} onChange={(e) => setExitData({...exitData, valuation: Number(e.target.value)})} />
                    </div>
                    <button onClick={handleSaveExitStatus} className="w-full sm:w-auto px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">Simpan</button>
                  </div>
                </div>

                {/* Revenue Streams */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-sm font-semibold text-slate-900">Aliran Pendapatan (Inkubator)</h3>
                    <button onClick={() => setIsAddingRevenue(!isAddingRevenue)} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                      {isAddingRevenue ? 'Batal' : '+ Catat Baru'}
                    </button>
                  </div>

                  {isAddingRevenue && (
                    <div className="border-l-2 border-slate-900 pl-4 mb-6 py-1 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                         <input type="date" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none" value={newRevenue.date} onChange={e => setNewRevenue({...newRevenue, date: e.target.value})} />
                         <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none" value={newRevenue.type} onChange={e => setNewRevenue({...newRevenue, type: e.target.value as any})}>
                            <option value="Profit Sharing">Profit Sharing</option><option value="Success Fee">Success Fee</option><option value="Lainnya">Lainnya</option>
                         </select>
                         <input type="number" placeholder="Nominal (Rp)" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none" value={newRevenue.amount || ''} onChange={e => setNewRevenue({...newRevenue, amount: Number(e.target.value)})} />
                         <input type="text" placeholder="Keterangan" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none" value={newRevenue.description} onChange={e => setNewRevenue({...newRevenue, description: e.target.value})} />
                      </div>
                      <button onClick={() => { if(newRevenue.amount) { addRevenue.mutate(newRevenue as any); setIsAddingRevenue(false); setNewRevenue({date: new Date().toISOString().split('T')[0], amount: 0, type: 'Profit Sharing', description: ''}) } }} className="px-4 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md">Simpan Data</button>
                    </div>
                  )}

                  {revenues.length === 0 ? (
                    <p className="text-sm font-light text-slate-500 italic">Belum ada catatan pendapatan.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {revenues.map(rev => (
                        <div key={rev.id} className="py-3 flex justify-between items-center group">
                           <div>
                             <p className="text-sm font-semibold text-slate-900">{formatRupiah(rev.amount)}</p>
                             <p className="text-xs text-slate-500 font-light mt-0.5">{new Date(rev.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})} • {rev.type} {rev.description && `(${rev.description})`}</p>
                           </div>
                           <button onClick={() => removeRevenue.mutate(rev.id!)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"><Trash2 size={16}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Billing History */}
                <div>
                  <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-sm font-semibold text-slate-900">Riwayat Tagihan & Pembayaran</h3>
                  </div>
                  {tenantInvoices.length === 0 ? (
                    <p className="text-sm font-light text-slate-500 italic">Tidak ada histori tagihan.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {tenantInvoices.map(invoice => (
                        <div key={invoice.id} className="py-3 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{formatRupiah(invoice.totalAmount)}</p>
                            <p className="text-xs text-slate-500 font-light uppercase tracking-wider">{invoice.invoiceNumber} • {new Date(invoice.dueDate).toLocaleDateString('id-ID')}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                            invoice.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
            
          </div>
        </div>

      </div>
    </>
  );
}