'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTenants, useTenantTeam, useTenantMilestones } from '@/hooks/useTenants';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Users, TrendingUp, Linkedin, Trash2, X, Star, ExternalLink, Award, Rocket, Target, Handshake } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantTractionPage() {
  const { user } = useAuth();
  const { useTenantProfile } = useTenants();
  
  // PERBAIKAN: Gunakan email ATAU uid untuk Anonymous Login
  const { data: profile, isLoading: isProfileLoading } = useTenantProfile(user?.email || user?.uid);
  
  const { teamMembers, isLoading: isTeamLoading, addMember, removeMember } = useTenantTeam(profile?.id);
  const { milestones, isLoading: isMilestoneLoading, addMilestone, removeMilestone } = useTenantMilestones(profile?.id);

  const [activeTab, setActiveTab] = useState<'Tim' | 'Milestone'>('Tim');
  
  // States for Team Drawer/Modal
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', role: '', bio: '', linkedinUrl: '', isFounder: false });

  // States for Milestone Drawer/Modal
  const [isMileModalOpen, setIsMileModalOpen] = useState(false);
  const [isSubmittingMile, setIsSubmittingMile] = useState(false);
  const [mileForm, setMileForm] = useState({ date: '', category: 'Product', title: '', description: '', articleUrl: '' });

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTeam(true);
    try {
      await addMember.mutateAsync(teamForm);
      toast.success("Anggota tim berhasil ditambahkan!");
      setIsTeamModalOpen(false);
      setTeamForm({ name: '', role: '', bio: '', linkedinUrl: '', isFounder: false });
    } catch (error) {
      toast.error("Gagal menambah anggota tim");
    } finally {
      setIsSubmittingTeam(false);
    }
  };

  const handleMileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingMile(true);
    try {
      // @ts-ignore
      await addMilestone.mutateAsync(mileForm);
      toast.success("Milestone berhasil dicatat!");
      setIsMileModalOpen(false);
      setMileForm({ date: '', category: 'Product', title: '', description: '', articleUrl: '' });
    } catch (error) {
      toast.error("Gagal menyimpan milestone");
    } finally {
      setIsSubmittingMile(false);
    }
  };

  if (isProfileLoading || isTeamLoading || isMilestoneLoading) {
    return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-indigo-600" /></div>;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-slate-200/50 mt-6">
        <TrendingUp size={48} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-800 mb-2">Profil Belum Lengkap</h2>
        <p className="text-slate-500 text-center max-w-md">Lengkapi Profil Anda terlebih dahulu di menu "Profil Publik" untuk membuka akses Manajemen Tim dan Traction.</p>
      </div>
    );
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Product': return <Rocket size={16} />;
      case 'Funding': return <Handshake size={16} />;
      case 'Metric': return <Target size={16} />;
      case 'Partnership': return <Users size={16} />;
      case 'Award': return <Award size={16} />;
      default: return <Star size={16} />;
    }
  };

  return (
    <div className="w-full space-y-8 pb-12">
      
      {/* HEADER & TAB SWITCHER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Kekuatan & Pertumbuhan</h1>
          <p className="text-slate-500 mt-2 text-lg">Kelola tim inti dan catat sejarah perjalanan startup Anda.</p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200/60 inline-flex w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('Tim')} 
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'Tim' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            <Users size={18} /> Anggota Tim
          </button>
          <button 
            onClick={() => setActiveTab('Milestone')} 
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'Milestone' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            <TrendingUp size={18} /> Jurnal Traction
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'Tim' && (
          <motion.div key="tim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">Manajemen Tim Inti</h2>
              <button onClick={() => setIsTeamModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition-all hover:scale-105">
                <Plus size={16} /> Tambah Anggota
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((member, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  key={member.id} 
                  className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-xl hover:border-indigo-100 transition-all group relative"
                >
                  <button onClick={() => removeMember.mutate(member.id!)} className="absolute top-4 right-4 w-8 h-8 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={14} />
                  </button>
                  <div className="flex items-center gap-5 mb-5">
                    <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center text-indigo-600 font-black text-2xl shrink-0 shadow-inner">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight flex items-center gap-1.5 text-lg">
                        {member.name} {member.isFounder && <Star size={16} className="text-amber-500 fill-amber-500" />}
                      </h3>
                      <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mt-1">{member.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-5">{member.bio || 'Tidak ada biografi singkat.'}</p>
                  {member.linkedinUrl && (
                    <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] font-bold text-xs rounded-xl transition-colors">
                      <Linkedin size={14} /> Terhubung di LinkedIn
                    </a>
                  )}
                </motion.div>
              ))}
              {teamMembers.length === 0 && (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-300 rounded-[2rem] text-slate-400 bg-white/30 backdrop-blur-sm">
                  <Users size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-semibold">Belum ada anggota tim inti yang ditambahkan.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'Milestone' && (
          <motion.div key="milestone" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">Sejarah & Pencapaian</h2>
              <button onClick={() => setIsMileModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition-all hover:scale-105">
                <Plus size={16} /> Catat Pencapaian
              </button>
            </div>

            <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-white/60 shadow-lg">
              {milestones.length === 0 ? (
                 <div className="text-center py-10 text-slate-400">
                   <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
                   <p className="text-base font-semibold">Buku Jurnal Anda masih kosong.</p>
                   <p className="text-sm">Catat setiap pembaruan produk atau pendanaan di sini.</p>
                 </div>
              ) : (
                <div className="relative border-l-2 border-indigo-100 ml-4 md:ml-8 space-y-12 py-4">
                  {milestones.map((mile, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      key={mile.id} className="relative pl-8 md:pl-12 group"
                    >
                      {/* Node Timeline */}
                      <span className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-white bg-indigo-500 shadow-sm group-hover:scale-125 group-hover:bg-indigo-600 transition-all"></span>
                      
                      <div className="bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-indigo-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-indigo-600 bg-indigo-100/50 px-3 py-1.5 rounded-lg">{mile.date}</span>
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-200 bg-white px-2.5 py-1 rounded-md">
                              {getCategoryIcon(mile.category)} {mile.category}
                            </span>
                          </div>
                          <button onClick={() => removeMilestone.mutate(mile.id!)} className="w-8 h-8 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{mile.title}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">{mile.description}</p>
                        
                        {mile.articleUrl && (
                          <a href={mile.articleUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg w-fit">
                            <ExternalLink size={14}/> Baca Selengkapnya
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================
          MODAL TIM INTI
      ========================================= */}
      <AnimatePresence>
        {isTeamModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsTeamModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative z-10">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800">Tambah Anggota</h2>
                <button onClick={() => setIsTeamModalOpen(false)} className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors"><X size={18}/></button>
              </div>
              <form onSubmit={handleTeamSubmit} className="p-8 space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Nama Lengkap</label>
                  <input required type="text" value={teamForm.name} onChange={e=>setTeamForm({...teamForm, name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Jabatan (CTO, CMO, dll)</label>
                  <input required type="text" value={teamForm.role} onChange={e=>setTeamForm({...teamForm, role: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Bio Singkat</label>
                  <textarea rows={3} value={teamForm.bio} onChange={e=>setTeamForm({...teamForm, bio: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all"></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">LinkedIn URL</label>
                  <input type="url" value={teamForm.linkedinUrl} onChange={e=>setTeamForm({...teamForm, linkedinUrl: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="https://..." />
                </div>
                <label className="flex items-center gap-3 cursor-pointer pt-2 bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <input type="checkbox" checked={teamForm.isFounder} onChange={e=>setTeamForm({...teamForm, isFounder: e.target.checked})} className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500" />
                  <span className="text-sm font-bold text-amber-900">Tandai sebagai Co-Founder</span>
                </label>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsTeamModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                  <button type="submit" disabled={isSubmittingTeam} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-500/30 disabled:opacity-70 flex items-center gap-2">
                    {isSubmittingTeam && <Loader2 className="w-4 h-4 animate-spin"/>} Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================
          MODAL MILESTONE
      ========================================= */}
      <AnimatePresence>
        {isMileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMileModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden relative z-10">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800">Catat Milestone Baru</h2>
                <button onClick={() => setIsMileModalOpen(false)} className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors"><X size={18}/></button>
              </div>
              <form onSubmit={handleMileSubmit} className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Bulan & Tahun</label>
                    <input required type="month" value={mileForm.date} onChange={e=>setMileForm({...mileForm, date: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Kategori</label>
                    <select value={mileForm.category} onChange={e=>setMileForm({...mileForm, category: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                      <option value="Product">Rilis Produk</option>
                      <option value="Funding">Pendanaan</option>
                      <option value="Metric">Metrik User/Sales</option>
                      <option value="Partnership">Kerja Sama</option>
                      <option value="Award">Penghargaan</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Judul Pencapaian</label>
                  <input required type="text" value={mileForm.title} onChange={e=>setMileForm({...mileForm, title: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Meraih 10,000 Pengguna Aktif" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Keterangan / Cerita</label>
                  <textarea required rows={4} value={mileForm.description} onChange={e=>setMileForm({...mileForm, description: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Ceritakan proses pencapaian ini..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Link Bukti/Berita (Opsional)</label>
                  <input type="url" value={mileForm.articleUrl} onChange={e=>setMileForm({...mileForm, articleUrl: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="https://" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsMileModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                  <button type="submit" disabled={isSubmittingMile} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-500/30 disabled:opacity-70 flex items-center gap-2">
                    {isSubmittingMile && <Loader2 className="w-4 h-4 animate-spin"/>} Simpan Jurnal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}