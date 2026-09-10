'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTenants, useTenantMentoring, useTenantMonev, useTenantKPI } from '@/hooks/useTenants';
import { formatRupiah, TenantKPI, DynamicMetric } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, BookOpen, Users, Calendar, Video, MessageSquare, 
  LineChart, CheckCircle2, ListChecks, TrendingUp, AlertCircle,
  Plus, X, Flame, Hourglass, DollarSign, BarChart2, Trash2, Target
} from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'kurikulum' | 'mentoring' | 'logbook' | 'kpi';

const DEFAULT_CURRICULUM: { id: string; title: string; isCompleted: boolean; completedAt?: number }[] = [
  { id: 'cur-1', title: 'Validasi Problem-Solution Fit', isCompleted: false },
  { id: 'cur-2', title: 'Business Model Canvas (BMC) Disetujui', isCompleted: false },
  { id: 'cur-3', title: 'Legalitas Badan Usaha (PT/CV) Terbit', isCompleted: false },
  { id: 'cur-4', title: 'Rilis Minimum Viable Product (MVP)', isCompleted: false },
  { id: 'cur-5', title: 'Mendapatkan Traksi (100 User Pertama)', isCompleted: false },
  { id: 'cur-6', title: 'Pitch Deck & Financial Model Final', isCompleted: false },
];

export default function TenantIncubationPage() {
  const { user } = useAuth();
  
  // Mengambil Profil Utama
  const { useTenantProfile } = useTenants();
  
  // PERBAIKAN: Menggunakan fallback user?.uid jika email kosong
  const { data: profile, isLoading: isProfileLoading } = useTenantProfile(user?.email || user?.uid);

  // Mengambil Data Sub-collections
  const { sessions, isLoading: isSessionsLoading } = useTenantMentoring(profile?.id);
  const { monevs, isLoading: isMonevsLoading } = useTenantMonev(profile?.id);
  const { kpis, isLoading: isKPIsLoading, addKPI, removeKPI } = useTenantKPI(profile?.id);

  const [activeTab, setActiveTab] = useState<TabType>('kurikulum');

  // --- STATE UNTUK FORM SELF-REPORTING KPI ---
  const [isAddingKPI, setIsAddingKPI] = useState(false);
  const [isSubmittingKPI, setIsSubmittingKPI] = useState(false);
  const [newKPI, setNewKPI] = useState<Partial<TenantKPI>>({
    period: '', 
    burnRate: 0, 
    runwayMonths: 0, 
    fundingAcquired: 0, 
    healthStatus: 'Healthy', 
    metrics: [],
    topAchievements: '',
    currentBottlenecks: '',
    notes: ''
  });
  const [metricInput, setMetricInput] = useState<Partial<DynamicMetric>>({
    name: '', unit: 'Rp', targetValue: 0, actualValue: 0, category: 'Traction'
  });

  const handleAjukanReview = () => {
    toast.success("Pengajuan review kurikulum berhasil dikirim ke mentor Anda.");
  };

  const handleAddMetricToKPI = () => {
    if (!metricInput.name) return;
    setNewKPI(prev => ({
      ...prev,
      metrics: [...(prev.metrics || []), { ...metricInput, id: crypto.randomUUID() } as DynamicMetric]
    }));
    setMetricInput({ name: '', unit: 'Rp', targetValue: 0, actualValue: 0, category: 'Traction' });
  };

  const handleRemoveMetricFromKPI = (idToRemove: string) => {
    setNewKPI(prev => ({
      ...prev,
      metrics: (prev.metrics || []).filter(m => m.id !== idToRemove)
    }));
  };

  const handleSubmitKPI = async () => {
    if (!newKPI.period) {
      toast.error('Periode laporan (Bulan/Kuartal) wajib diisi.');
      return;
    }
    setIsSubmittingKPI(true);
    try {
      await addKPI.mutateAsync(newKPI as any);
      setIsAddingKPI(false);
      setNewKPI({ period: '', burnRate: 0, runwayMonths: 0, fundingAcquired: 0, healthStatus: 'Healthy', metrics: [], topAchievements: '', currentBottlenecks: '', notes: '' });
      toast.success('Laporan kinerja (KPI) berhasil dikirim!');
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengirim laporan KPI.');
    } finally {
      setIsSubmittingKPI(false);
    }
  };

  if (isProfileLoading || isSessionsLoading || isMonevsLoading || isKPIsLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center w-full">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-slate-200/50 py-24 flex flex-col items-center justify-center text-center px-4 w-full mt-6">
        <BookOpen size={48} className="text-slate-300 mb-4" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">Akses Ditolak</h3>
        <p className="text-slate-500 text-sm max-w-md">
          Profil startup Anda belum terhubung. Harap lengkapi Profil Publik atau hubungi Admin Inkubator.
        </p>
      </div>
    );
  }

  const curriculumItems = profile.curriculumChecklist && profile.curriculumChecklist.length > 0 
    ? profile.curriculumChecklist 
    : DEFAULT_CURRICULUM;
  const completedCount = curriculumItems.filter(item => item.isCompleted).length;
  const progressPercent = Math.round((completedCount / curriculumItems.length) * 100) || 0;

  return (
    <div className="space-y-8 w-full pb-12">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-2xl shadow-inner">
              <BookOpen size={28} />
            </div> 
            Ruang Inkubasi
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Pantau progres pembelajaran, catatan mentor, dan lapor metrik kinerja startup Anda.
          </p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200/60 inline-flex flex-wrap w-full md:w-auto gap-1">
        <button onClick={() => setActiveTab('kurikulum')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'kurikulum' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
          <ListChecks size={18} /> Kurikulum
        </button>
        <button onClick={() => setActiveTab('mentoring')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'mentoring' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
          <Users size={18} /> Jadwal Mentoring
        </button>
        <button onClick={() => setActiveTab('logbook')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'logbook' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
          <MessageSquare size={18} /> Logbook Evaluasi
        </button>
        <button onClick={() => setActiveTab('kpi')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'kpi' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
          <LineChart size={18} /> Rapor KPI
        </button>
      </div>

      {/* TAB CONTENT AREA */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            
            {/* --- TAB: KURIKULUM --- */}
            {activeTab === 'kurikulum' && (
              <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 md:p-10">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 border-b border-slate-100 pb-8 mb-8">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                      <TrendingUp className="text-indigo-600"/> Progres Kompetensi
                    </h3>
                    <p className="text-slate-500 font-medium mt-2 max-w-xl">
                      Daftar capaian standar kompetensi (Milestone) yang wajib diselesaikan sebelum kelulusan program inkubasi.
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-[1.5rem] p-5 w-full md:w-56 text-center shrink-0 shadow-inner">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tingkat Penyelesaian</p>
                    <h4 className="text-4xl font-black text-indigo-600">{progressPercent}%</h4>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-4 mb-10 overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full" 
                  />
                </div>

                <div className="space-y-4">
                  {curriculumItems.map((item, index) => (
                    <div key={item.id} className={`flex items-center gap-5 p-5 rounded-[1.5rem] border transition-all ${item.isCompleted ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 shrink-0 transition-colors ${item.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'border-slate-300 text-transparent'}`}>
                        <CheckCircle2 size={20} className={item.isCompleted ? "block" : "hidden"} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold text-base ${item.isCompleted ? 'text-emerald-900 opacity-80 line-through' : 'text-slate-800'}`}>
                          {index + 1}. {item.title}
                        </p>
                        {item.isCompleted && item.completedAt && (
                          <p className="text-[11px] font-bold text-emerald-600 mt-1 uppercase tracking-wider">
                            Disetujui pada: {new Date(item.completedAt).toLocaleDateString('id-ID')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end">
                  <button onClick={handleAjukanReview} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105">
                    Ajukan Review & Validasi
                  </button>
                </div>
              </div>
            )}

            {/* --- TAB: MENTORING --- */}
            {activeTab === 'mentoring' && (
              <div className="space-y-6">
                {sessions.length === 0 ? (
                  <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] shadow-sm border border-dashed border-slate-300 py-24 text-center px-4 w-full">
                    <Video size={48} className="text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Jadwal</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">Admin atau mentor belum mengatur jadwal sesi 1-on-1 dengan startup Anda.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {sessions.map(session => (
                      <div key={session.id} className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-sm hover:shadow-lg transition-all group flex gap-5">
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[80px] text-center shrink-0 shadow-inner">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{new Date(session.date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                          <span className="text-3xl font-black text-slate-800 my-1">{new Date(session.date).getDate()}</span>
                          <span className="text-xs font-bold text-slate-500">{session.time}</span>
                        </div>
                        <div className="flex-1 min-w-0 py-1 flex flex-col">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-lg font-black text-slate-900 truncate pr-4">{session.topic}</p>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border shrink-0 ${session.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700 border-blue-200' : session.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                              {session.status}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-500 mb-4 flex items-center gap-1.5">
                            <Users size={14}/> Bersama Mentor: <span className="font-bold text-slate-700">{session.mentorName}</span>
                          </p>
                          <div className="mt-auto">
                            {session.status === 'SCHEDULED' ? (
                              <button className="text-sm font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl w-full flex items-center justify-center gap-2 transition-colors">
                                <Video size={16}/> Gabung via G-Meet
                              </button>
                            ) : (
                              <p className="text-xs font-bold text-slate-400 italic">Sesi telah berlalu.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- TAB: LOGBOOK (MONEV) --- */}
            {activeTab === 'logbook' && (
              <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 md:p-10">
                <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 mb-8 border-b border-slate-100 pb-6">
                  <MessageSquare className="text-indigo-600"/> Catatan & Evaluasi Mentor (Logbook)
                </h3>
                
                {monevs.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <AlertCircle size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-bold">Belum ada catatan mentoring yang diberikan.</p>
                  </div>
                ) : (
                  <div className="border-l-2 border-indigo-100 ml-4 pl-6 md:pl-8 space-y-10 py-2">
                    {monevs.map(log => (
                      <div key={log.id} className="relative group">
                        <div className="absolute -left-[35px] md:-left-[43px] w-4 h-4 bg-indigo-500 rounded-full ring-4 ring-white shadow-sm" />
                        <div>
                          <p className="text-xs font-black text-indigo-600 mb-1 uppercase tracking-widest">
                            {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <h4 className="text-lg font-bold text-slate-800 mb-3">{log.title}</h4>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-5 rounded-[1.5rem] shadow-sm relative">
                          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <MessageSquare size={60} />
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap relative z-10">
                            {log.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- TAB: RAPOR KPI (SELF REPORTING) --- */}
            {activeTab === 'kpi' && (
              <div className="space-y-8">
                
                {/* Header Section KPI */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-200 pb-6 gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2"><LineChart className="text-indigo-600"/> Laporan Kinerja Startup</h3>
                    <p className="text-slate-500 font-medium mt-1">Sampaikan laporan perkembangan bulanan ke Manajemen Inkubator.</p>
                  </div>
                  <button onClick={() => setIsAddingKPI(!isAddingKPI)} className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 flex items-center gap-2 hover:scale-105 shrink-0">
                    {isAddingKPI ? <X size={18}/> : <Plus size={18}/>} {isAddingKPI ? 'Batal Mengisi' : 'Buat Laporan Bulan Ini'}
                  </button>
                </div>

                {/* FORM INPUT KPI BARU (SELF REPORTING) */}
                {isAddingKPI && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[2.5rem] border border-indigo-200 shadow-xl shadow-indigo-100/50 mb-8 space-y-8">
                    
                    {/* Bagian 1: Informasi Dasar & Survival Metrics */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 border-b border-indigo-100 pb-2 mb-5">1. Laporan Finansial (Survival Metrics)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-2">Periode Laporan <span className="text-red-500">*</span></label>
                          <input type="text" placeholder="Misal: Laporan Agustus 2024" className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={newKPI.period} onChange={e => setNewKPI({...newKPI, period: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-2">Penilaian Kondisi (Self-Assessment)</label>
                          <select className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer" value={newKPI.healthStatus} onChange={e => setNewKPI({...newKPI, healthStatus: e.target.value as any})}>
                            <option value="Healthy">📈 Sehat / Sedang Bertumbuh</option>
                            <option value="Warning">⚠️ Stagnan / Menemui Hambatan</option>
                            <option value="Critical">🚨 Berisiko Tinggi (Butuh Bantuan)</option>
                          </select>
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2"><Flame size={14} className="text-red-500"/> Avg. Monthly Burn Rate (Rp)</label>
                          <input type="number" placeholder="Total pengeluaran rata-rata bulanan" className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={newKPI.burnRate || ''} onChange={e => setNewKPI({...newKPI, burnRate: Number(e.target.value)})} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2"><Hourglass size={14} className="text-amber-500"/> Runway (Sisa Bulan)</label>
                          <input type="number" placeholder="Sisa nafas" className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={newKPI.runwayMonths || ''} onChange={e => setNewKPI({...newKPI, runwayMonths: Number(e.target.value)})} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2"><DollarSign size={14} className="text-emerald-500"/> Dana Masuk (Bulan Ini)</label>
                          <input type="number" placeholder="Investasi/Hibah" className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={newKPI.fundingAcquired || ''} onChange={e => setNewKPI({...newKPI, fundingAcquired: Number(e.target.value)})} />
                        </div>
                      </div>
                    </div>

                    {/* Bagian 2: Metrik Dinamis (Traction, Product, dll) */}
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                      <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2"><BarChart2 size={16}/> 2. Target vs Pencapaian Aktual</h4>
                      <p className="text-sm text-slate-500 mb-5">Tambahkan metrik "North Star" Anda. Apa saja yang menjadi fokus utama startup Anda bulan ini?</p>
                      
                      {/* List of Added Metrics */}
                      <div className="space-y-3 mb-5">
                        {newKPI.metrics?.map((metric) => (
                          <div key={metric.id} className="flex justify-between items-center bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">{metric.category}</span>
                                <span className="text-sm font-bold text-slate-800">{metric.name}</span>
                              </div>
                              <div className="text-xs text-slate-500 font-medium">
                                Target: <span className="font-bold text-slate-700">{metric.targetValue} {metric.unit}</span> <span className="mx-2 text-slate-300">|</span> 
                                Aktual: <span className="font-black text-indigo-600">{metric.actualValue} {metric.unit}</span>
                              </div>
                            </div>
                            <button type="button" onClick={() => handleRemoveMetricFromKPI(metric.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18}/></button>
                          </div>
                        ))}
                        {(!newKPI.metrics || newKPI.metrics.length === 0) && (
                          <p className="text-sm text-slate-400 font-medium text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl">Belum ada metrik dinamis yang dilaporkan.</p>
                        )}
                      </div>

                      {/* Form Add New Metric */}
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <input type="text" placeholder="Nama Metrik (cth: GMV, Pertumbuhan User)" className="md:col-span-2 px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={metricInput.name} onChange={e => setMetricInput({...metricInput, name: e.target.value})} />
                        <select className="px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={metricInput.unit} onChange={e => setMetricInput({...metricInput, unit: e.target.value as any})}>
                          <option value="Rp">Rp</option><option value="USD">USD</option><option value="Users">Users</option><option value="%">%</option><option value="Item">Item / Trx</option>
                        </select>
                        <input type="number" placeholder="Target Angka" className="px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={metricInput.targetValue || ''} onChange={e => setMetricInput({...metricInput, targetValue: Number(e.target.value)})} />
                        <input type="number" placeholder="Aktual Diraih" className="px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={metricInput.actualValue || ''} onChange={e => setMetricInput({...metricInput, actualValue: Number(e.target.value)})} />
                        <button type="button" onClick={handleAddMetricToKPI} className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl px-4 py-3 transition-colors shadow-md">Tambah Metrik</button>
                      </div>
                    </div>

                    {/* Bagian 3: Qualitative OKR */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 border-b border-indigo-100 pb-2 mb-5">3. Ringkasan Kualitatif</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">Pencapaian Utama (Top Achievements) Bulan Ini</label>
                          <textarea rows={3} placeholder="Ceritakan progres bisnis, fitur baru rilis, atau kemenangan kecil yang diraih..." className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={newKPI.topAchievements || ''} onChange={e => setNewKPI({...newKPI, topAchievements: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">Hambatan Utama (Current Bottlenecks)</label>
                          <textarea rows={3} placeholder="Apa masalah terbesar yang menahan laju startup Anda saat ini? Tulis agar Mentor dapat membantu." className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={newKPI.currentBottlenecks || ''} onChange={e => setNewKPI({...newKPI, currentBottlenecks: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-indigo-100">
                      <button onClick={handleSubmitKPI} disabled={isSubmittingKPI} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3.5 rounded-2xl text-base font-black shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100 flex items-center gap-2">
                        {isSubmittingKPI && <Loader2 className="w-5 h-5 animate-spin" />} Kirim Laporan ke Admin
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* DAFTAR RAPOR KPI */}
                {kpis.length === 0 && !isAddingKPI ? (
                  <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] shadow-sm border border-dashed border-slate-300 py-24 text-center px-4 w-full">
                    <LineChart size={48} className="text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Laporan KPI</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">Mulai laporkan traksi dan metrik pertumbuhan bulanan startup Anda untuk ditinjau oleh inkubator.</p>
                    <button onClick={() => setIsAddingKPI(true)} className="bg-indigo-50 text-indigo-700 font-bold px-6 py-3 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors inline-flex items-center gap-2">
                      <Plus size={18}/> Buat Laporan Pertama
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {kpis.map(kpi => {
                      // Persiapan Data Metrik (Menggabungkan dynamic & legacy data support)
                      const displayMetrics: DynamicMetric[] = kpi.metrics && kpi.metrics.length > 0 ? kpi.metrics : [
                        ...(kpi.revenue ? [{ id: 'leg-rev', name: 'Total Omzet (Legacy)', category: 'Financial', unit: 'Rp', targetValue: 0, actualValue: kpi.revenue } as DynamicMetric] : []),
                        ...(kpi.activeUsers ? [{ id: 'leg-usr', name: 'Pelanggan Aktif (Legacy)', category: 'Traction', unit: 'Users', targetValue: 0, actualValue: kpi.activeUsers } as DynamicMetric] : [])
                      ];

                      return (
                        <div key={kpi.id} className="bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group">
                          
                          {/* Health Score Indikator */}
                          <div className={`absolute left-0 top-0 bottom-0 w-2 
                            ${kpi.healthStatus === 'Healthy' ? 'bg-emerald-500' : 
                              kpi.healthStatus === 'Warning' ? 'bg-amber-500' : 'bg-red-500'}
                          `} />

                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pl-4 border-b border-slate-100 pb-5 gap-4">
                            <div className="flex items-center gap-4">
                              <h4 className="font-black text-slate-800 text-2xl">{kpi.period}</h4>
                              <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border shadow-sm
                                ${kpi.healthStatus === 'Healthy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                  kpi.healthStatus === 'Warning' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}
                              `}>
                                {kpi.healthStatus === 'Healthy' ? 'Performa: Sehat (Growth)' : 
                                 kpi.healthStatus === 'Warning' ? 'Performa: Stagnan (Warning)' : 'Performa: Risiko Tinggi'}
                              </span>
                            </div>
                            <button onClick={() => removeKPI.mutate(kpi.id!)} className="opacity-0 group-hover:opacity-100 p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                          </div>

                          {/* Section 1: Survival Metrics */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4 mb-8">
                             <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 shadow-sm">
                               <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Flame size={14}/> Avg. Burn Rate</p>
                               <h3 className="text-xl font-black text-slate-800">{formatRupiah(kpi.burnRate || 0)} <span className="text-xs font-medium text-slate-500">/ bln</span></h3>
                             </div>
                             <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 shadow-sm">
                               <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Hourglass size={14}/> Sisa Runway</p>
                               <h3 className="text-xl font-black text-slate-800">{kpi.runwayMonths || 0} <span className="text-sm font-medium text-slate-500">Bulan</span></h3>
                             </div>
                             <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 shadow-sm">
                               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 mb-2"><DollarSign size={14}/> Dana Terserap / Diraih</p>
                               <h3 className="text-xl font-black text-slate-800">{formatRupiah(kpi.fundingAcquired || 0)}</h3>
                             </div>
                          </div>

                          {/* Section 2: Dynamic Metrics Visualisasi */}
                          {displayMetrics.length > 0 && (
                            <div className="pl-4 mb-8">
                              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Target size={14}/> Capaian Metrik Dinamis</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {displayMetrics.map(metric => {
                                  const progress = metric.targetValue > 0 
                                    ? Math.min((metric.actualValue / metric.targetValue) * 100, 100) 
                                    : (metric.actualValue > 0 ? 100 : 0);
                                  
                                  const isAchieved = metric.actualValue >= metric.targetValue && metric.targetValue > 0;

                                  return (
                                    <div key={metric.id} className="border border-slate-200 rounded-[1.5rem] p-5 bg-white shadow-sm hover:border-indigo-300 transition-colors">
                                      <div className="flex justify-between items-start mb-3">
                                        <p className="text-sm font-bold text-slate-700">{metric.name}</p>
                                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase">{metric.category}</span>
                                      </div>
                                      <div className="flex items-end gap-2 mb-4">
                                        <h4 className={`text-2xl font-black tracking-tight ${isAchieved ? 'text-emerald-600' : 'text-slate-800'}`}>
                                          {metric.unit === 'Rp' ? formatRupiah(metric.actualValue) : metric.actualValue.toLocaleString()} 
                                          <span className="text-xs font-medium text-slate-500 ml-1.5">{metric.unit}</span>
                                        </h4>
                                      </div>
                                      {/* Progress Bar Container */}
                                      <div>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                                          <span>Tercapai: {progress.toFixed(0)}%</span>
                                          <span>Target: {metric.unit === 'Rp' ? formatRupiah(metric.targetValue) : metric.targetValue.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                                          <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${isAchieved ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                            style={{ width: `${progress}%` }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Section 3: Qualitative Data */}
                          {(kpi.topAchievements || kpi.currentBottlenecks || kpi.notes) && (
                            <div className="pl-4">
                              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Catatan Laporan</h5>
                              <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-100 space-y-5 shadow-sm">
                                {kpi.topAchievements && (
                                  <div>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Top Achievements</p>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{kpi.topAchievements}</p>
                                  </div>
                                )}
                                {kpi.currentBottlenecks && (
                                  <div>
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Current Bottlenecks (Kendala)</p>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{kpi.currentBottlenecks}</p>
                                  </div>
                                )}
                                {kpi.notes && (
                                  <div className="pt-4 border-t border-slate-200 mt-4">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Feedback Mentor / Admin</p>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{kpi.notes}"</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}