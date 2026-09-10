// Lokasi file: src/app/profil/components/TabAlumni.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Alumni, Project } from '@/types';
import { alumniService } from '@/services/alumni.service';
import { storageService } from '@/services/storage.service';
import { toast } from 'sonner';
import { 
  Loader2, Briefcase, Building, Linkedin, MapPin, Save, GraduationCap, 
  User, FileText, Code, Globe, Github, Sparkles, CheckCircle2,
  Clock, MonitorSmartphone, Target, Award, Image as ImageIcon,
  Languages, Maximize2, Minimize2, Camera, UploadCloud, Plus, Trash2, CalendarDays, ShieldCheck,
  BookOpen
} from 'lucide-react';
import Image from 'next/image';

interface TabAlumniProps {
  initialData: Alumni;
}

const INDUSTRY_OPTIONS = [
  "Teknologi Informasi & Software",
  "Manufaktur & Teknik",
  "Bisnis, Manajemen & Operasional",
  "Pemasaran & Digital Marketing",
  "Desain & Kreatif",
  "Keuangan & Akuntansi",
  "Pendidikan & Pelatihan",
  "Kesehatan & Medis",
  "Retail & E-commerce",
  "Lainnya"
];

const EXPERIENCE_OPTIONS = [
  "Fresh Graduate (0 Tahun)",
  "Junior (1 - 3 Tahun)",
  "Mid-Level (3 - 5 Tahun)",
  "Senior (5 - 10 Tahun)",
  "Expert / Lead (> 10 Tahun)"
];

const WORK_SETUP_OPTIONS = [
  "Fleksibel (Remote / WFO)",
  "Remote (Work From Home)",
  "On-site (Work From Office)",
  "Hybrid"
];

const EMPLOYMENT_STATUS_OPTIONS = [
  "Proses Verifikasi",
  "Bekerja (Full-time)",
  "Bekerja (Part-time / Freelance)",
  "Wirausaha / Membangun Bisnis",
  "Pendidikan Lanjut / Kuliah",
  "Mencari Kerja (Open to Work)",
  "Lainnya"
];

export default function TabAlumni({ initialData }: TabAlumniProps) {
  const [data, setData] = useState<Alumni>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // State untuk Loading Upload
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [uploadingProjectIdx, setUploadingProjectIdx] = useState<number | null>(null);

  // Refs untuk File Inputs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // State Form Komprehensif (Menyesuaikan dengan field tambahan dari Excel)
  const [formData, setFormData] = useState({
    employmentStatus: (!initialData.employmentStatus || initialData.employmentStatus === 'Belum Bekerja') ? 'Proses Verifikasi' : initialData.employmentStatus,
    currentJob: initialData.currentJob || '',
    company: initialData.company || '',
    address: initialData.address || '',
    bio: initialData.bio || '',
    skills: initialData.skills?.join(', ') || '', 
    tools: initialData.tools?.join(', ') || '',
    experienceLevel: initialData.experienceLevel || '',
    industry: initialData.industry || '',
    workSetup: initialData.workSetup || '',
    education: initialData.education || '',
    major: initialData.major || '',
    languages: initialData.languages || '',
    linkedinUrl: initialData.linkedinUrl || '',
    githubUrl: initialData.githubUrl || '',
    portfolioUrl: initialData.portfolioUrl || '',
    isLookingForJob: initialData.isLookingForJob || false,
    
    photoUrl: initialData.photoUrl || '',
    resumeFileUrl: initialData.resumeFileUrl || '',
    certifications: initialData.certifications || [],
    projects: initialData.projects || []
  });

  // --- HANDLERS UNTUK INPUT DASAR ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleLookingForJob = () => {
    setFormData({ ...formData, isLookingForJob: !formData.isLookingForJob });
  };

  // --- HANDLERS UNTUK UPLOAD FILE (FOTO & RESUME) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'resume') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi Ukuran (Max 2MB untuk foto, 5MB untuk PDF)
    const maxSize = type === 'photo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Ukuran file terlalu besar. Maksimal ${type === 'photo' ? '2MB' : '5MB'}`);
      return;
    }

    try {
      if (type === 'photo') setIsUploadingPhoto(true);
      else setIsUploadingResume(true);

      const folderPath = type === 'photo' ? 'alumni/photos' : 'alumni/resumes';
      const downloadUrl = await storageService.uploadFile(file, folderPath);

      setFormData(prev => ({ 
        ...prev, 
        [type === 'photo' ? 'photoUrl' : 'resumeFileUrl']: downloadUrl 
      }));
      
      toast.success(`${type === 'photo' ? 'Foto Profil' : 'Dokumen CV'} berhasil diunggah!`);
    } catch (error) {
      toast.error("Gagal mengunggah file. Silakan coba lagi.");
    } finally {
      if (type === 'photo') setIsUploadingPhoto(false);
      else setIsUploadingResume(false);
      e.target.value = '';
    }
  };

  // --- HANDLERS UNTUK SERTIFIKASI DINAMIS ---
  const handleAddCertification = () => {
    setFormData(prev => ({ ...prev, certifications: [...prev.certifications, ''] }));
  };
  const handleCertChange = (index: number, value: string) => {
    const newCerts = [...formData.certifications];
    newCerts[index] = value;
    setFormData(prev => ({ ...prev, certifications: newCerts }));
  };
  const handleRemoveCert = (index: number) => {
    const newCerts = formData.certifications.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, certifications: newCerts }));
  };

  // --- HANDLERS UNTUK PROYEK PORTOFOLIO DINAMIS ---
  const handleAddProject = () => {
    setFormData(prev => ({ 
      ...prev, 
      projects: [...prev.projects, { title: '', description: '', linkUrl: '', imageUrl: '' }] 
    }));
  };
  const handleProjectChange = (index: number, field: keyof Project, value: string) => {
    const newProjects = [...formData.projects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    setFormData(prev => ({ ...prev, projects: newProjects }));
  };
  const handleRemoveProject = (index: number) => {
    const newProjects = formData.projects.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, projects: newProjects }));
  };
  const handleProjectImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Ukuran gambar maksimal 2MB");

    try {
      setUploadingProjectIdx(index);
      const downloadUrl = await storageService.uploadFile(file, 'alumni/projects');
      handleProjectChange(index, 'imageUrl', downloadUrl);
      toast.success("Gambar proyek berhasil diunggah!");
    } catch (error) {
      toast.error("Gagal mengunggah gambar proyek.");
    } finally {
      setUploadingProjectIdx(null);
      e.target.value = '';
    }
  };


  // --- HANDLER SIMPAN DATA UTAMA ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.id) return toast.error("Terjadi kesalahan, ID Alumni tidak ditemukan.");

    setIsSaving(true);
    try {
      const cleanCertifications = formData.certifications.filter(c => c.trim() !== '');
      const cleanProjects = formData.projects.filter(p => p.title.trim() !== '');

      const payload = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0),
        tools: formData.tools.split(',').map(s => s.trim()).filter(s => s.length > 0),
        certifications: cleanCertifications,
        projects: cleanProjects
      };

      await alumniService.updateAlumni(data.id, payload as any);
      setData({ ...data, ...payload });
      toast.success("Profil Profesional Anda berhasil diperbarui!");
      if(isFocusMode) setIsFocusMode(false);
    } catch (error) {
      toast.error("Gagal menyimpan perubahan profil.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateCompleteness = () => {
    const fields = [
      formData.currentJob, formData.bio, formData.skills, formData.resumeFileUrl, 
      formData.experienceLevel, formData.industry, formData.education, formData.photoUrl
    ];
    const filledFields = fields.filter(f => f && f.length > 0).length;
    return Math.round((filledFields / fields.length) * 100);
  };
  const completeness = calculateCompleteness();

  return (
    <div className={`animate-in fade-in slide-in-from-bottom-2 duration-500 ${isFocusMode ? 'fixed inset-0 z-[100] bg-slate-50 overflow-y-auto p-4 md:p-8' : ''}`}>
      
      <div className={`${isFocusMode ? 'max-w-6xl mx-auto bg-white p-6 rounded-3xl shadow-xl' : ''} transition-all duration-500`}>
        {/* HEADER PROFIL */}
        {!isFocusMode && (
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 p-6 md:p-10 rounded-[2rem] text-white overflow-hidden relative shadow-2xl shadow-slate-200">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles size={160} />
            </div>
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-2 text-emerald-200">
                <Target size={14} /> Katalog Talent KST
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Profil Profesional</h2>
              <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
                Lengkapi data diri Anda secara mendetail untuk tampil di <strong>Direktori Talent KST</strong>. Profil yang komprehensif akan meningkatkan peluang Anda dilirik oleh mitra industri.
              </p>
            </div>
            
            <div className="relative z-10 shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex items-center gap-5">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-lg" viewBox="0 0 36 36">
                  <path className="text-white/10" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-emerald-400" strokeDasharray={`${completeness}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="absolute text-sm font-black">{completeness}%</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">Status Profil</p>
                <p className="text-base font-bold text-white leading-none">
                  {completeness === 100 ? 'Sempurna! 🚀' : completeness > 70 ? 'Hampir Lengkap' : 'Belum Lengkap'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TOOLBAR MODE FOKUS */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black text-slate-800">
            {isFocusMode ? 'Mode Fokus: Mengedit Profil' : 'Formulir Profil'}
          </h3>
          <button 
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${
              isFocusMode 
                ? 'bg-slate-800 text-white hover:bg-slate-700' 
                : 'bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200'
            }`}
          >
            {isFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {isFocusMode ? 'Keluar Mode Fokus' : 'Mode Fokus'}
          </button>
        </div>

        <div className={`grid grid-cols-1 ${isFocusMode ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-8 transition-all duration-500`}>
          
          {/* KOLOM KIRI: Data Terkunci (Riwayat Master Data) */}
          {!isFocusMode && (
            <div className="lg:col-span-4 space-y-6 animate-in fade-in slide-in-from-left-4">
              
              <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-sm sticky top-24">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-4 mb-5 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-500" /> Verifikasi Master Data KST
                </h3>
                
                {/* Menampilkan Foto Profil di Sini (jika ada) */}
                <div className="flex justify-center mb-6">
                  {formData.photoUrl ? (
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md relative group">
                      <Image src={formData.photoUrl} alt="Foto Profil" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center text-4xl font-black text-slate-400">
                      {data.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap Sesuai Sertifikat</span>
                    <p className="font-bold text-slate-800 bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm">{data.name}</p>
                  </div>

                  {data.birthInfo && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempat, Tgl Lahir</span>
                      <p className="font-bold text-slate-700 bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm text-sm">{data.birthInfo}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><GraduationCap size={14}/> Histori Program Pelatihan</span>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold mb-0.5">Program Spesifik</p>
                        <p className="text-sm font-bold text-slate-800">{data.programTaken || data.alumniType || 'Pelatihan Umum'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold mb-0.5">Batch/Angkatan</p>
                          <p className="text-sm font-semibold text-slate-700">{data.batch || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold mb-0.5">Tahun</p>
                          <p className="text-sm font-semibold text-slate-700">{data.trainingYear || data.graduationYear || '-'}</p>
                        </div>
                      </div>
                      
                      {(data.courseStartDate || data.courseEndDate) && (
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold mb-0.5 flex items-center gap-1"><CalendarDays size={12}/> Periode Pelatihan</p>
                          <p className="text-xs font-semibold text-slate-600">{data.courseStartDate || '?'} s/d {data.courseEndDate || '?'}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {data.certificationResult && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Award size={14}/> Sertifikasi Internal</span>
                      <p className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-xl shadow-sm text-sm">
                        {data.certificationResult}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-8 p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl flex gap-3 items-start">
                  <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={16} />
                  <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                    Data histori di atas adalah data master yang diinput oleh Admin KST berdasarkan sertifikat kelulusan. Hubungi Admin jika ada ketidaksesuaian.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* KOLOM KANAN: Form Input Portofolio User */}
          <div className={`${isFocusMode ? 'lg:col-span-1' : 'lg:col-span-8'} transition-all duration-500`}>
            <form onSubmit={handleSave} className="space-y-8">
              
              {/* KARTU 0: DOKUMEN & FOTO (NEW TAHAP 2) */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-8">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-3 border-b border-slate-50 pb-6">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><FileText size={20} /></div>
                  Dokumen Utama & Foto Profil
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Upload Foto */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 ml-1 block">Pas Foto Profesional</label>
                    <div className="flex items-center gap-5 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-slate-200 relative">
                        {formData.photoUrl ? (
                          <Image src={formData.photoUrl} alt="Preview" fill className="object-cover" />
                        ) : (
                          <User className="w-full h-full p-3 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input type="file" accept="image/jpeg, image/png" className="hidden" ref={photoInputRef} onChange={(e) => handleFileUpload(e, 'photo')} />
                        <button 
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:border-emerald-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
                        >
                          {isUploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                          {isUploadingPhoto ? 'Mengunggah...' : (formData.photoUrl ? 'Ganti Foto' : 'Unggah Foto')}
                        </button>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">Format: JPG/PNG. Maks: 2MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Upload Resume/CV PDF */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 ml-1 block">Dokumen CV / Resume (PDF)</label>
                    <div className="flex flex-col justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors h-full">
                      <input type="file" accept="application/pdf" className="hidden" ref={resumeInputRef} onChange={(e) => handleFileUpload(e, 'resume')} />
                      
                      {formData.resumeFileUrl ? (
                        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <div className="flex items-center gap-2 text-emerald-700">
                            <CheckCircle2 size={16} />
                            <span className="text-xs font-bold">CV Tersimpan</span>
                          </div>
                          <div className="flex gap-2">
                            <a href={formData.resumeFileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg" title="Lihat CV"><Globe size={14} /></a>
                            <button type="button" onClick={() => resumeInputRef.current?.click()} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Ganti Dokumen"><UploadCloud size={14} /></button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => resumeInputRef.current?.click()}
                          disabled={isUploadingResume}
                          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:border-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                        >
                          {isUploadingResume ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                          {isUploadingResume ? 'Mengunggah Dokumen...' : 'Unggah File PDF CV'}
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400 mt-2 text-center">Format: PDF. Maks: 5MB.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* KARTU 1: PREFERENSI & STATUS KERJA */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-6 gap-4">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Briefcase size={20} /></div>
                    Status & Karir
                  </h3>
                  
                  <button 
                    type="button"
                    onClick={toggleLookingForJob}
                    className={`flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black transition-all border ${
                      formData.isLookingForJob 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm ring-2 ring-emerald-500/20' 
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${formData.isLookingForJob ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    {formData.isLookingForJob ? 'OPEN TO WORK' : 'TIDAK MENCARI KERJA'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2.5 md:col-span-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Status Saat Ini</label>
                    <select name="employmentStatus" value={formData.employmentStatus} onChange={handleChange} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-emerald-500">
                      {EMPLOYMENT_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2.5 md:col-span-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Posisi / Pekerjaan</label>
                    <input name="currentJob" value={formData.currentJob} onChange={handleChange} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-emerald-500 outline-none" placeholder="Contoh: Teknisi / Welder" />
                  </div>
                  <div className="space-y-2.5 md:col-span-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Nama Perusahaan <span className="text-slate-400 font-normal">(Opsional)</span></label>
                    <input name="company" value={formData.company} onChange={handleChange} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-emerald-500 outline-none" placeholder="Contoh: PT Kawan Lama" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5"><Clock size={14}/> Level Pengalaman</label>
                    <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500">
                      <option value="">Pilih Pengalaman</option>
                      {EXPERIENCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5"><Building size={14}/> Industri</label>
                    <select name="industry" value={formData.industry} onChange={handleChange} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500">
                      <option value="">Pilih Industri</option>
                      {INDUSTRY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5"><MonitorSmartphone size={14}/> Work Setup</label>
                    <select name="workSetup" value={formData.workSetup} onChange={handleChange} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500">
                      <option value="">Pilih Setup</option>
                      {WORK_SETUP_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5"><MapPin size={14}/> Kota Domisili</label>
                  <input name="address" value={formData.address} onChange={handleChange} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500" placeholder="Contoh: Surakarta, Jawa Tengah" />
                </div>
              </div>

              {/* KARTU 2: BIO & SKILLS */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-8">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-3 border-b border-slate-50 pb-6">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><User size={20} /></div>
                  Tentang Saya & Keahlian
                </h3>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">Ringkasan Profil (Bio)</label>
                  <textarea name="bio" rows={4} value={formData.bio} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-emerald-500 resize-none" placeholder="Tuliskan ringkasan profesional Anda..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2.5 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                    <label className="text-xs font-bold text-slate-700 ml-1">Bidang Keahlian (Pisahkan dengan koma)</label>
                    <input name="skills" value={formData.skills} onChange={handleChange} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500" placeholder="Contoh: Welding 3G, AutoCAD" />
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.skills.split(',').map((skill, idx) => skill.trim() && (
                        <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-blue-100">{skill.trim()}</span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                    <label className="text-xs font-bold text-slate-700 ml-1">Tools / Software (Pisahkan dengan koma)</label>
                    <input name="tools" value={formData.tools} onChange={handleChange} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500" placeholder="Contoh: Figma, Excel, SAP" />
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.tools.split(',').map((tool, idx) => tool.trim() && (
                        <span key={idx} className="bg-white text-slate-700 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 shadow-sm">{tool.trim()}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* KARTU 3: PENDIDIKAN, BAHASA & SERTIFIKASI EKSTERNAL */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-8">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-3 border-b border-slate-50 pb-6">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><BookOpen size={20} /></div>
                  Pendidikan & Sertifikasi Tambahan
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Institusi Pendidikan Terakhir</label>
                    <input name="education" value={formData.education} onChange={handleChange} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-emerald-500" placeholder="Contoh: Universitas Sebelas Maret / SMK 2 Solo" />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Jurusan / Fakultas</label>
                    <input name="major" value={formData.major} onChange={handleChange} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-emerald-500" placeholder="Contoh: Teknik Mesin" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5"><Languages size={14}/> Bahasa yang Dikuasai</label>
                  <input name="languages" value={formData.languages} onChange={handleChange} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-emerald-500" placeholder="Contoh: Indonesia (Native), Inggris (Aktif)" />
                </div>

                {/* Section Sertifikasi Dinamis */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-black text-slate-800 flex items-center gap-2"><Award size={16} className="text-amber-500"/> Sertifikasi Eksternal / Profesional</label>
                    <button type="button" onClick={handleAddCertification} className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors">
                      <Plus size={14}/> Tambah
                    </button>
                  </div>
                  
                  {formData.certifications.length === 0 ? (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">Belum ada sertifikasi eksternal yang ditambahkan.</p>
                  ) : (
                    <div className="space-y-3">
                      {formData.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <input 
                            value={cert} 
                            onChange={(e) => handleCertChange(index, e.target.value)} 
                            className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500 focus:bg-white transition-colors" 
                            placeholder="Contoh: Sertifikat K3 Umum / Google Data Analytics" 
                          />
                          <button type="button" onClick={() => handleRemoveCert(index)} className="p-3 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl border border-slate-200 hover:border-red-200 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* KARTU 4: GALERI PROYEK */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><ImageIcon size={20} /></div>
                    Galeri Proyek / Portofolio Visual
                  </h3>
                  <button type="button" onClick={handleAddProject} className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition-colors shadow-sm">
                    <Plus size={14}/> Tambah Proyek
                  </button>
                </div>

                {formData.projects.length === 0 ? (
                  <p className="text-sm text-slate-500 bg-slate-50 p-8 rounded-2xl text-center border-2 border-dashed border-slate-200 font-medium">
                    Pamerkan hasil karya, penelitian, atau proyek terbaik Anda untuk menarik perhatian mitra industri.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {formData.projects.map((project, index) => (
                      <div key={index} className="p-6 bg-slate-50/80 border border-slate-200 rounded-2xl relative group">
                        <button type="button" onClick={() => handleRemoveProject(index)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-lg border border-slate-200 shadow-sm transition-colors z-10">
                          <Trash2 size={16} />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                          {/* Gambar Upload Area */}
                          <div className="md:col-span-3">
                            <label className="text-xs font-bold text-slate-700 block mb-2">Gambar / Thumbnail</label>
                            <div className="relative w-full aspect-video rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 hover:bg-slate-200 transition-colors overflow-hidden group/img flex items-center justify-center cursor-pointer">
                              {project.imageUrl ? (
                                <>
                                  <Image src={project.imageUrl} alt="Project Thumbnail" fill className="object-cover" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">Ganti Gambar</span>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center p-4">
                                  {uploadingProjectIdx === index ? <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" /> : <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />}
                                  <span className="text-[10px] text-slate-500 font-medium">Klik Upload</span>
                                </div>
                              )}
                              {/* Hidden Input File */}
                              <input 
                                type="file" accept="image/jpeg, image/png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => handleProjectImageUpload(index, e)}
                                disabled={uploadingProjectIdx === index}
                              />
                            </div>
                          </div>

                          {/* Form Input Data */}
                          <div className="md:col-span-9 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">Judul Proyek *</label>
                                <input value={project.title} onChange={(e) => handleProjectChange(index, 'title', e.target.value)} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-rose-500" placeholder="Misal: Redesign Website KST / Fabrikasi Mesin" required />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">Tautan (URL)</label>
                                <input value={project.linkUrl || ''} onChange={(e) => handleProjectChange(index, 'linkUrl', e.target.value)} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-rose-500" placeholder="https://..." />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-500 uppercase">Deskripsi Singkat & Peran Anda</label>
                              <textarea rows={2} value={project.description || ''} onChange={(e) => handleProjectChange(index, 'description', e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-rose-500 resize-none" placeholder="Ceritakan apa yang Anda buat dan peran spesifik Anda di proyek ini..." />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* KARTU 5: TAUTAN EKSTERNAL */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-8">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-3 border-b border-slate-50 pb-6">
                  <div className="p-2 bg-slate-800 text-white rounded-xl"><Globe size={20} /></div>
                  Profil Media Sosial & Web
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5"><Linkedin size={14} className="text-blue-600"/> URL LinkedIn</label>
                    <input name="linkedinUrl" type="url" value={formData.linkedinUrl} onChange={handleChange} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-emerald-500" placeholder="https://linkedin.com/in/username" />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5"><Github size={14} className="text-slate-800"/> URL GitHub / Dribbble</label>
                    <input name="githubUrl" type="url" value={formData.githubUrl} onChange={handleChange} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-emerald-500" placeholder="Link profil karya spesifik Anda" />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5"><Code size={14} className="text-indigo-500"/> Website Pribadi</label>
                    <input name="portfolioUrl" type="url" value={formData.portfolioUrl} onChange={handleChange} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-emerald-500" placeholder="https://website-saya.com" />
                  </div>
                </div>
              </div>

              {/* TOMBOL SIMPAN */}
              <div className={`pt-4 flex justify-end ${isFocusMode ? 'sticky bottom-6 z-10' : ''}`}>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-full text-sm font-black shadow-xl shadow-emerald-600/20 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-600/30 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  {isSaving ? 'MENYIMPAN PROFIL...' : 'SIMPAN PROFIL PROFESIONAL'}
                </button>
              </div>
            </form>
          </div>
          
        </div>
      </div>
    </div>
  );
}