'use client';

import React, { useState } from 'react';
import { useAlumniSearch } from '@/hooks/useAlumniSearch';
import { useAlumni } from '@/hooks/useAlumni';
import { Alumni } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import { canPerformAction, PERMISSIONS } from '@/config/roles';
import { toast } from 'sonner';
import { 
  Search, Briefcase, MapPin, GraduationCap, ExternalLink, 
  FileText, Github, Linkedin, X, User, CheckCircle2, 
  Loader2, Target, Users, Award, Image as ImageIcon,
  DownloadCloud, Globe, ChevronDown, Activity, CalendarDays
} from 'lucide-react';
import Image from 'next/image';

const INTERNAL_STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: '✅ Tersedia (Available)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'INTERVIEWING', label: '⏳ Sedang Interview', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'HIRED', label: '💼 Telah Disalurkan (Hired)', color: 'text-blue-700 bg-blue-50 border-blue-200' },
];

export default function TalentPoolTab() {
  const { role } = useAuth();
  
  const canManageTalent = canPerformAction(role, PERMISSIONS.MANAGE_TALENT);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpenToWork, setFilterOpenToWork] = useState(false);
  const [filterInternalStatus, setFilterInternalStatus] = useState<string>('ALL');
  
  const [selectedTalent, setSelectedTalent] = useState<Alumni | any | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { results: filteredTalents, loading, hasNextPage, loadMore } = useAlumniSearch({
    query: searchTerm,
    status: 'CLAIMED',
    internalStatus: filterInternalStatus !== 'ALL' ? filterInternalStatus : undefined,
    isLookingForJob: filterOpenToWork ? true : undefined,
    perPage: 12
  });

  const { updateAlumni } = useAlumni();

  const handleUpdateInternalStatus = async (statusValue: 'AVAILABLE' | 'INTERVIEWING' | 'HIRED') => {
    if (!canManageTalent) {
      toast.error("Akses Ditolak", { description: "Hanya Admin Karir yang diizinkan untuk mengubah status pipeline." });
      return;
    }

    if (!selectedTalent?.id) return;
    
    setIsUpdatingStatus(true);
    try {
      await updateAlumni(selectedTalent.id, { internalStatus: statusValue } as any);
      setSelectedTalent({ ...selectedTalent, internalStatus: statusValue });
      toast.success(`Status kandidat berhasil diubah.`);
    } catch (error) {
      toast.error('Gagal memperbarui status internal.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    const s = status || 'AVAILABLE';
    const option = INTERNAL_STATUS_OPTIONS.find(opt => opt.value === s);
    if (!option) return null;
    return (
      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${option.color} flex items-center gap-1 w-max`}>
        {s === 'AVAILABLE' && <CheckCircle2 size={12} />}
        {s === 'INTERVIEWING' && <Activity size={12} />}
        {s === 'HIRED' && <Briefcase size={12} />}
        {option.label.split(' ')[1]}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input placeholder="Cari nama, pekerjaan, keahlian..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none transition-all" />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <select value={filterInternalStatus} onChange={(e) => setFilterInternalStatus(e.target.value)} className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none cursor-pointer">
            <option value="ALL">Semua Pipeline</option><option value="AVAILABLE">Tersedia (Available)</option><option value="INTERVIEWING">Sedang Interview</option><option value="HIRED">Telah Disalurkan</option>
          </select>

          <button onClick={() => setFilterOpenToWork(!filterOpenToWork)} className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${filterOpenToWork ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm ring-2 ring-emerald-500/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${filterOpenToWork ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} /> Open to Work
          </button>
        </div>
      </div>

      {loading && filteredTalents.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 bg-white rounded-3xl border border-slate-200 border-dashed"><Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" /><span className="font-bold">Mencari direktori talent...</span></div>
      ) : filteredTalents.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 bg-white rounded-3xl border border-slate-200 border-dashed"><Users className="h-12 w-12 text-slate-300 mb-3" /><span className="font-bold">Tidak ada talent yang cocok dengan filter.</span></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTalents.map((talent) => (
            <div key={talent.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col h-full relative">
              <div className="absolute top-4 left-4 z-10">{getStatusBadge(talent.internalStatus)}</div>
              {talent.isLookingForJob && <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-sm z-10">Open To Work</div>}

              <div className="p-6 pt-12 pb-5 flex-1 relative flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-slate-100 flex items-center justify-center mb-4 overflow-hidden relative">
                  {talent.photoUrl ? <Image src={talent.photoUrl} alt={talent.name} fill className="object-cover" /> : <span className="text-3xl font-black text-slate-300">{talent.name?.charAt(0).toUpperCase()}</span>}
                </div>

                <div className="mb-4">
                  <h3 className="font-black text-slate-800 text-xl leading-tight line-clamp-1 group-hover:text-emerald-600 transition-colors">{talent.name}</h3>
                  <p className="text-xs font-bold text-slate-500 line-clamp-1 mt-1">{talent.currentJob || 'Belum ada posisi kerja'} {talent.company && ` di ${talent.company}`}</p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 text-[11px] text-slate-600 font-medium w-full mb-4">
                  <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg"><Briefcase size={12} className="text-slate-400"/> {talent.experienceLevel || '-'}</span>
                  <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg" title={talent.programTaken || talent.alumniType}><GraduationCap size={12} className="text-slate-400"/> {talent.programTaken || talent.alumniType || 'Alumni'} {talent.batch ? `(${talent.batch})` : ''}</span>
                </div>

                <div className="flex flex-wrap justify-center gap-1.5 mt-auto w-full">
                  {(talent.skills || []).slice(0, 4).map((skill: string, idx: number) => (
                    <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg truncate max-w-[100px]">{skill}</span>
                  ))}
                  {(talent.skills || []).length > 4 && <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-lg">+{(talent.skills || []).length - 4}</span>}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/80 mt-auto shrink-0">
                <button onClick={() => setSelectedTalent(talent)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-sm">Lihat Profil Lengkap & Resume</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <button onClick={loadMore} disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:bg-emerald-50 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> Memuat...</> : 'Muat Lebih Banyak Talent'}
          </button>
        </div>
      )}

      {selectedTalent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3"><div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><User size={20} /></div><div><h3 className="text-lg font-black text-slate-800 leading-tight">Detail Kandidat</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Katalog Alumni KST</p></div></div>
              <button onClick={() => setSelectedTalent(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors bg-white border border-slate-200"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50/30">
              <div className="flex flex-col md:flex-row gap-8 mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-32 h-32 rounded-3xl border-4 border-slate-50 shadow-md bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 relative">
                  {selectedTalent.photoUrl ? <Image src={selectedTalent.photoUrl} alt={selectedTalent.name} fill className="object-cover" /> : <span className="text-5xl font-black text-slate-300">{selectedTalent.name?.charAt(0).toUpperCase()}</span>}
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-2"><h2 className="text-3xl font-black text-slate-900">{selectedTalent.name}</h2><span className="flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"><CheckCircle2 size={12}/> Alumni {selectedTalent.trainingYear || selectedTalent.graduationYear}</span></div>
                    <p className="text-lg font-bold text-slate-600">{selectedTalent.currentJob || 'Posisi belum diatur'} {selectedTalent.company && <span className="text-slate-400 font-medium"> di {selectedTalent.company}</span>}</p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">Status saat ini: <span className="text-emerald-600">{selectedTalent.employmentStatus || 'Belum Bekerja'}</span></p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><Briefcase size={14} className="text-slate-400"/> {selectedTalent.experienceLevel || '-'}</div><div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><Target size={14} className="text-slate-400"/> {selectedTalent.industry || '-'}</div><div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><MapPin size={14} className="text-slate-400"/> {selectedTalent.address || '-'}</div>
                  </div>
                </div>

                <div className="md:w-64 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col shrink-0">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={14} className="text-blue-500"/> Pipeline Status</h4>
                  <div className="relative">
                    <select value={selectedTalent.internalStatus || 'AVAILABLE'} onChange={(e) => handleUpdateInternalStatus(e.target.value as any)} disabled={isUpdatingStatus || !canManageTalent} className="w-full appearance-none px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer disabled:opacity-50">
                      {INTERNAL_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  {!canManageTalent && <span className="text-[9px] text-slate-400 mt-2 italic block text-center">Hanya Staf Karir yang dapat mengubah status</span>}
                  {isUpdatingStatus && <span className="text-[10px] text-blue-500 flex items-center gap-1 mt-2 font-bold animate-pulse"><Loader2 size={10} className="animate-spin"/> Menyimpan...</span>}
                  
                  <div className="mt-auto pt-4 flex gap-2">
                    {selectedTalent.resumeFileUrl ? <a href={selectedTalent.resumeFileUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"><DownloadCloud size={14} /> Unduh CV PDF</a> : <button disabled className="flex-1 flex items-center justify-center gap-2 bg-slate-200 text-slate-500 px-3 py-2.5 rounded-xl text-xs font-bold cursor-not-allowed"><FileText size={14} /> CV Kosong</button>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 space-y-8">
                  {/* Riwayat Pelatihan STP (Dari Data Import Admin) */}
                  <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 shadow-sm">
                    <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest mb-4 flex items-center gap-2"><GraduationCap size={16}/> Histori Pelatihan Solo Technopark</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm col-span-2">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Program Spesifik</p>
                        <p className="text-sm font-bold text-slate-800">{selectedTalent.programTaken || selectedTalent.alumniType || 'Pelatihan Umum'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Batch / Angkatan</p>
                        <p className="text-sm font-bold text-slate-800">{selectedTalent.batch || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Tahun</p>
                        <p className="text-sm font-bold text-slate-800">{selectedTalent.trainingYear || selectedTalent.graduationYear || '-'}</p>
                      </div>
                    </div>
                    {(selectedTalent.courseStartDate || selectedTalent.certificationResult) && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(selectedTalent.courseStartDate || selectedTalent.courseEndDate) && (
                          <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mb-1"><CalendarDays size={12}/> Tanggal Pelaksanaan</p>
                            <p className="text-xs font-semibold text-slate-700">{selectedTalent.courseStartDate || '?'} s/d {selectedTalent.courseEndDate || '?'}</p>
                          </div>
                        )}
                        {selectedTalent.certificationResult && (
                          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 shadow-sm">
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1 mb-1"><Award size={12}/> Sertifikasi Kompetensi</p>
                            <p className="text-xs font-bold text-emerald-800">{selectedTalent.certificationResult}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User size={14}/> Ringkasan Profil</h4>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">{selectedTalent.bio || <span className="italic text-slate-400 bg-slate-50 px-3 py-1 rounded-md">Talent belum mengisi ringkasan bio.</span>}</div>
                  </section>

                  <section>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ImageIcon size={14}/> Galeri Portofolio</h4>
                    {selectedTalent.projects && selectedTalent.projects.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedTalent.projects.map((project: any, idx: number) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden group flex flex-col shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-full aspect-video bg-slate-100 relative border-b border-slate-100">
                              {project.imageUrl ? <Image src={project.imageUrl} alt={project.title} fill className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-slate-300"><ImageIcon size={32} /></div>}
                              {project.linkUrl && <a href={project.linkUrl} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink size={14} /></a>}
                            </div>
                            <div className="p-4 flex-1 flex flex-col"><h5 className="font-bold text-sm text-slate-800 line-clamp-1 mb-1">{project.title}</h5><p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">{project.description || 'Tidak ada deskripsi.'}</p></div>
                          </div>
                        ))}
                      </div>
                    ) : <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-8 flex items-center justify-center text-slate-400 text-sm italic">Belum ada portofolio yang diunggah.</div>}
                  </section>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><GraduationCap size={14}/> Pendidikan Formal</h4>
                      <p className="font-bold text-slate-800 text-sm mb-1">{selectedTalent.education || '-'}</p>{selectedTalent.major && <p className="text-xs text-slate-500 font-medium">{selectedTalent.major}</p>}
                    </section>
                    <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Award size={14} className="text-amber-500"/> Sertifikasi Eksternal</h4>
                      {selectedTalent.certifications && selectedTalent.certifications.length > 0 ? <ul className="space-y-2">{selectedTalent.certifications.map((cert: string, idx: number) => <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 font-medium"><Award size={14} className="text-amber-400 mt-0.5 shrink-0" /><span>{cert}</span></li>)}</ul> : <span className="text-xs italic text-slate-400">Belum ada sertifikasi tambahan.</span>}
                    </section>
                  </div>
                </div>

                <div className="space-y-6">
                  <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Keahlian Utama</h4>
                    {selectedTalent.skills && selectedTalent.skills.length > 0 ? <div className="flex flex-wrap gap-2">{selectedTalent.skills.map((skill: string, idx: number) => <span key={idx} className="bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold px-3 py-1.5 rounded-lg">{skill}</span>)}</div> : <p className="text-xs text-slate-400 italic">Belum ada data skill.</p>}
                  </section>
                  <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Tools / Software</h4>
                    {selectedTalent.tools && selectedTalent.tools.length > 0 ? <div className="flex flex-wrap gap-2">{selectedTalent.tools.map((tool: string, idx: number) => <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm">{tool}</span>)}</div> : <p className="text-xs text-slate-400 italic">Belum ada data tools.</p>}
                  </section>
                  <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Tautan Eksternal</h4>
                    <div className="space-y-2">
                      {selectedTalent.linkedinUrl && <a href={selectedTalent.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"><Linkedin size={16}/> LinkedIn <ExternalLink size={12} className="ml-auto"/></a>}
                      {selectedTalent.githubUrl && <a href={selectedTalent.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"><Github size={16}/> GitHub / Dribbble <ExternalLink size={12} className="ml-auto"/></a>}
                      {selectedTalent.portfolioUrl && <a href={selectedTalent.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"><Globe size={16}/> Website Pribadi <ExternalLink size={12} className="ml-auto"/></a>}
                    </div>
                  </section>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}