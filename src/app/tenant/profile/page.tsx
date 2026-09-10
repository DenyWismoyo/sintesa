'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTenants } from '@/hooks/useTenants';
import { tenantService } from '@/services/tenant.service';
import { Tenant, TenantSchema } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, FormProvider, useFormContext, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Loader2, UploadCloud, Building, Globe, CheckCircle2, 
  Save, Sparkles, Target, Palette, DollarSign, Handshake, Briefcase, 
  SwitchCamera, Eye, ExternalLink, Instagram, Linkedin,
  Plus, Trash2, BarChart, Layout, PlaySquare, Image as ImageIcon, MessageSquare,
  Megaphone, UserPlus, FileText, Code2, HelpCircle, Search, AlertCircle, CircleDashed, ShieldCheck, FileKey, X, PieChart,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

type ProfileTab = 'Branding & SEO' | 'Metrik & PR' | 'Halaman Kustom' | 'Sosial & FAQ' | 'Karir & Tech' | 'Pendanaan & Cap Table' | 'Legalitas & VDR';

const compressImage = async (file: File) => {
  if (!file.type.startsWith('image/')) return file;
  const options = {
    maxSizeMB: 1, 
    maxWidthOrHeight: 1920, 
    useWebWorker: true, 
  };
  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error("Gagal mengompres gambar:", error);
    return file; 
  }
};

export default function TenantProfilePage() {
  const { user } = useAuth();
  const { updateTenant, useTenantProfile } = useTenants();
  
  // PERBAIKAN DI SINI: Kirimkan email ATAU uid sebagai identifier
  const { data: profile, isLoading } = useTenantProfile(user?.email || user?.uid);

  const [activeTab, setActiveTab] = useState<ProfileTab>('Branding & SEO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  
  // State Dokumen VDR & Pitch Deck
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
  const [aktaFile, setAktaFile] = useState<File | null>(null);
  const [skFile, setSkFile] = useState<File | null>(null);
  const [hkiFile, setHkiFile] = useState<File | null>(null);
  const [fmFile, setFmFile] = useState<File | null>(null);

  const [newClientLogoFiles, setNewClientLogoFiles] = useState<File[]>([]);
  const [newClientLogoPreviews, setNewClientLogoPreviews] = useState<string[]>([]);
  const [sectionImageUploads, setSectionImageUploads] = useState<{ [sectionId: string]: File }>({});
  const [sectionImagePreviews, setSectionImagePreviews] = useState<{ [sectionId: string]: string }>({});

  const methods = useForm<any>({
    resolver: zodResolver(TenantSchema),
    mode: 'onChange', 
  });

  const { handleSubmit, reset, watch, formState: { isDirty, errors }, setValue } = methods;

  // Sync data dari Firebase ke Form
  useEffect(() => {
    if (profile) {
      reset(profile);
      setLogoPreview(profile.logoUrl || '');
      setCoverPreview(profile.coverImageUrl || '');
      setNewClientLogoFiles([]);
      setNewClientLogoPreviews([]);
      setSectionImageUploads({});
      setSectionImagePreviews({});
    }
  }, [profile, reset]);

  // Handle Submit Form
  const onSubmit = async (data: any) => {
    const tenantId = profile?.id;
    if (!tenantId) return;
    
    setIsSubmitting(true);
    let finalData = { ...data };

    try {
      if (newClientLogoFiles.length > 0) {
        const newLogoUrls = await Promise.all(newClientLogoFiles.map(file => tenantService.uploadFile(tenantId, file, 'logos')));
        finalData.clientLogos = [...(finalData.clientLogos || []), ...newLogoUrls];
      }
      if (finalData.customSections) {
        for (let i = 0; i < finalData.customSections.length; i++) {
          const secId = finalData.customSections[i].id;
          if (sectionImageUploads[secId]) {
             finalData.customSections[i].mediaUrl = await tenantService.uploadFile(tenantId, sectionImageUploads[secId], 'covers'); 
          }
        }
      }

      // Upload VDR Files jika ada perubahan
      if (aktaFile) {
        finalData.vdr = { ...finalData.vdr, aktaPendirianUrl: await tenantService.uploadFile(tenantId, aktaFile, 'documents') };
      }
      if (skFile) {
        finalData.vdr = { ...finalData.vdr, skKemenkumhamUrl: await tenantService.uploadFile(tenantId, skFile, 'documents') };
      }
      if (hkiFile) {
        finalData.vdr = { ...finalData.vdr, hkiSertifikatUrl: await tenantService.uploadFile(tenantId, hkiFile, 'documents') };
      }
      if (fmFile) {
        finalData.vdr = { ...finalData.vdr, financialModelUrl: await tenantService.uploadFile(tenantId, fmFile, 'documents') };
      }

      // Mengirim ke Firebase
      const result = await updateTenant(tenantId, finalData, logoFile, null, pitchDeckFile, coverFile);

      if (result.success) {
        toast.success("Profil & Data Room berhasil diperbarui!");
        setLogoFile(null); setPitchDeckFile(null); setCoverFile(null);
        setAktaFile(null); setSkFile(null); setHkiFile(null); setFmFile(null);
        setNewClientLogoFiles([]); setNewClientLogoPreviews([]);
        setSectionImageUploads({}); setSectionImagePreviews({});
        reset(finalData); 
      } else {
        toast.error("Gagal menyimpan profil: " + result.error);
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan sistem saat mengunggah file.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formValues = watch();
  
  const hasNamePitch = !!formValues.name && !!formValues.elevatorPitch;
  const hasLogo = !!formValues.logoUrl || !!logoFile;
  const hasContact = !!formValues.contact && !!formValues.sector;
  const hasLegal = !!formValues.nib && formValues.legalEntity !== 'Belum Ada';
  const hasDeck = !!formValues.pitchDeckUrl || !!pitchDeckFile;
  const hasMetrics = formValues.keyMetrics && formValues.keyMetrics.length > 0;
  
  // Syarat tambahan untuk Level Investor-Ready
  const hasCapTable = formValues.capTable && formValues.capTable.length > 0;
  const hasVDR = !!formValues.vdr?.aktaPendirianUrl || !!aktaFile;

  const completenessChecklist = [
    { label: 'Nama & Slogan Startup', done: hasNamePitch, level: 1 },
    { label: 'Logo Resmi', done: hasLogo, level: 1 },
    { label: 'Sektor & Kontak Utama', done: hasContact, level: 2 },
    { label: 'Legalitas Badan Hukum', done: hasLegal, level: 2 },
    { label: 'Pitch Deck & Cap Table', done: hasDeck && hasCapTable, level: 3 },
    { label: 'Virtual Data Room (VDR)', done: hasVDR, level: 3 },
  ];
  
  const completedItems = completenessChecklist.filter(c => c.done).length;
  const progressPercent = Math.round((completedItems / completenessChecklist.length) * 100) || 0;
  
  const getCurrentLevel = () => {
    if (completedItems >= 6) return { name: 'Level 3 (Investor-Ready)', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
    if (completedItems >= 4) return { name: 'Level 2 (Verified Startup)', color: 'text-indigo-700 bg-indigo-100 border-indigo-300' };
    return { name: 'Level 1 (Basic Profile)', color: 'text-amber-700 bg-amber-100 border-amber-300' };
  };
  const currentLevel = getCurrentLevel();

  if (isLoading) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center space-y-4">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
        <p className="text-slate-500 font-medium">Memuat data profil & VDR...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white/60 backdrop-blur-md rounded-[2.5rem] shadow-sm border border-slate-200/60 mt-6">
        <div className="h-24 w-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-100"><Building size={40} /></div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Profil Belum Terdaftar</h2>
        <p className="text-slate-500 text-center max-w-md text-sm leading-relaxed">Akun Anda belum ditautkan ke entitas startup mana pun. Hubungi Admin Inkubator untuk mengaitkan akun ini.</p>
      </div>
    );
  }

  const tabs: { id: ProfileTab, icon: any }[] = [
    { id: 'Branding & SEO', icon: Sparkles },
    { id: 'Legalitas & VDR', icon: Briefcase }, 
    { id: 'Pendanaan & Cap Table', icon: Handshake },
    { id: 'Metrik & PR', icon: BarChart },
    { id: 'Karir & Tech', icon: UserPlus },
    { id: 'Sosial & FAQ', icon: Globe },
    { id: 'Halaman Kustom', icon: Layout },
  ];

  return (
    <FormProvider {...methods}>
      <div className="relative w-full pb-32">
        
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-4">
              Setup Profil & VDR
              <span className={`text-xs px-3.5 py-1.5 rounded-full border shadow-sm font-bold tracking-wide uppercase ${currentLevel.color}`}>
                {currentLevel.name}
              </span>
            </h1>
            <p className="text-slate-500 mt-2 text-lg max-w-2xl">
              Lengkapi *Virtual Data Room* dan Profil Publik untuk mempermudah proses <span className="font-bold text-slate-700">Due Diligence</span> oleh investor global.
            </p>
          </div>
          
          <div className="w-full md:w-64 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm shrink-0">
             <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Progress</span>
                <span className="text-sm font-black text-indigo-600">{progressPercent}%</span>
             </div>
             <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" />
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col xl:flex-row gap-8 items-start">
          
          <div className="flex-1 w-full flex flex-col md:flex-row gap-6">
            
            <div className="w-full md:w-60 shrink-0 flex flex-col gap-2 relative">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                const hasErrorInTab = 
                  (tab.id === 'Branding & SEO' && (errors.name || errors.elevatorPitch)) ||
                  (tab.id === 'Legalitas & VDR' && (errors.ownerName || errors.contact || errors.sector || errors.nib));

                return (
                  <button 
                    key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} 
                    className={`relative flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold text-sm transition-all overflow-hidden ${isActive ? 'text-indigo-700 shadow-sm border border-indigo-100/50 bg-indigo-50/50' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200/50'}`}
                  >
                    {isActive && <motion.div layoutId="activeProfileTab" className="absolute inset-0 bg-white shadow-sm border border-indigo-100 rounded-2xl z-0" />}
                    <div className="relative z-10 flex items-center gap-3">
                      <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} /> 
                      <span>{tab.id}</span>
                    </div>
                    {hasErrorInTab && <AlertCircle size={14} className="text-red-500 relative z-10" />}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden min-h-[600px]">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                  className="p-8 space-y-8"
                >
                  {Object.keys(errors).length > 0 && (
                     <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                           <p className="font-bold text-sm">Validasi Gagal</p>
                           <p className="text-xs mt-1">Terdapat field wajib yang belum diisi atau salah format. Periksa tab yang memiliki tanda peringatan.</p>
                        </div>
                     </div>
                  )}

                  {activeTab === 'Branding & SEO' && <TabBranding />}
                  
                  {activeTab === 'Legalitas & VDR' && (
                    <TabLegalitasVDR 
                      aktaFile={aktaFile} setAktaFile={setAktaFile}
                      skFile={skFile} setSkFile={setSkFile}
                      hkiFile={hkiFile} setHkiFile={setHkiFile}
                      fmFile={fmFile} setFmFile={setFmFile}
                    />
                  )}
                  
                  {activeTab === 'Pendanaan & Cap Table' && (
                    <TabPendanaanCapTable 
                      pitchDeckFile={pitchDeckFile} setPitchDeckFile={setPitchDeckFile} 
                    />
                  )}
                  
                  {activeTab === 'Metrik & PR' && <TabMetrik newClientLogoPreviews={newClientLogoPreviews} setNewClientLogoFiles={setNewClientLogoFiles} setNewClientLogoPreviews={setNewClientLogoPreviews} />}
                  {activeTab === 'Karir & Tech' && <TabKarir />}
                  {activeTab === 'Sosial & FAQ' && <TabSosial />}
                  {activeTab === 'Halaman Kustom' && <TabCustom sectionImagePreviews={sectionImagePreviews} setSectionImageUploads={setSectionImageUploads} setSectionImagePreviews={setSectionImagePreviews} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="w-full xl:w-[380px] shrink-0 space-y-6">
            
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/60">
              <h3 className="font-black text-slate-800 flex items-center gap-2 mb-5">
                <Target size={18} className="text-indigo-500" /> "What's Missing?" Checklist
              </h3>
              
              <div className="space-y-3">
                {completenessChecklist.map((item, idx) => (
                  <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${item.done ? 'bg-emerald-50/50 border border-emerald-100/50' : 'bg-slate-50 border border-slate-100'}`}>
                    {item.done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <CircleDashed className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-sm font-bold ${item.done ? 'text-slate-800 line-through opacity-70' : 'text-slate-700'}`}>{item.label}</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${item.done ? 'text-emerald-600/60' : 'text-amber-500'}`}>
                        {item.done ? 'Selesai' : `Syarat Level ${item.level}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {progressPercent === 100 && (
                <div className="mt-6 bg-gradient-to-r from-emerald-600 to-teal-500 p-4 rounded-xl text-white text-center shadow-lg shadow-emerald-500/20">
                   <ShieldCheck className="mx-auto mb-2" size={24} />
                   <p className="font-black text-sm">Investor Ready!</p>
                   <p className="text-xs font-medium text-emerald-100 mt-1">VDR dan Profil Anda sudah 100% siap untuk proses Due Diligence.</p>
                </div>
              )}
            </div>

            <div className="sticky top-8 bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                <span className="flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-widest"><Eye size={14} /> Live Preview</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="p-2">
                <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner relative group">
                  
                  <div className="h-32 bg-slate-100 relative group/cover">
                    {coverPreview ? <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${formValues.brandColor || '#3B82F6'}40, ${formValues.brandColor || '#3B82F6'}80)` }}></div>}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white backdrop-blur-sm">
                      <UploadCloud size={24} className="mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Ubah Cover</span>
                      <input type="file" accept="image/*" className="hidden" onChange={async e => { 
                        if (e.target.files?.[0]) { 
                          const compressedFile = await compressImage(e.target.files[0]);
                          setCoverFile(compressedFile); 
                          setCoverPreview(URL.createObjectURL(compressedFile)); 
                          setValue('coverImageUrl', 'changed', {shouldDirty: true}); 
                        } 
                      }}/>
                    </label>
                  </div>
                  
                  <div className="px-6 pb-6 relative z-10">
                    <div className="flex justify-between items-end -mt-10 mb-3">
                      <div className="relative w-20 h-20 bg-white p-1 rounded-2xl shadow-md border border-slate-100 shrink-0 group/logo">
                        {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain rounded-xl" /> : <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 font-bold text-2xl border border-dashed border-slate-200">Logo</div>}
                        <label className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <SwitchCamera className="text-white w-5 h-5" />
                          <input type="file" accept="image/*" className="hidden" onChange={async e => { 
                            if (e.target.files?.[0]) { 
                              const compressedFile = await compressImage(e.target.files[0]);
                              setLogoFile(compressedFile); 
                              setLogoPreview(URL.createObjectURL(compressedFile)); 
                              setValue('logoUrl', 'changed', {shouldDirty: true}); 
                            } 
                          }} />
                        </label>
                      </div>
                      {formValues.isRaising && <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">Fundraising</span>}
                    </div>
                    
                    <h2 className="text-xl font-black text-slate-900 leading-tight">{formValues.name || 'Nama Startup'}</h2>
                    <p className="text-xs font-semibold text-indigo-600 mt-0.5 mb-3">{formValues.sector || 'Sektor Industri'}</p>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">{formValues.elevatorPitch || 'Tuliskan slogan memikat yang mendeskripsikan startup Anda dalam satu kalimat...'}</p>
                    
                    {formValues.currentNeeds && formValues.currentNeeds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {formValues.currentNeeds.slice(0, 3).map((need: string, idx: number) => <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md">{need}</span>)}
                        {formValues.currentNeeds.length > 3 && <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md">+{formValues.currentNeeds.length - 3}</span>}
                      </div>
                    )}

                    <div className="w-full py-2.5 rounded-xl text-center text-sm font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02]" style={{ backgroundColor: formValues.brandColor || '#4F46E5' }}>
                      {formValues.primaryCta?.text || 'Kunjungi Website'} <ExternalLink size={14} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </form>

        <AnimatePresence>
          {isDirty && (
            <motion.div initial={{ y: 150, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 150, opacity: 0, scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="fixed bottom-8 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
              <div className="bg-slate-900/95 backdrop-blur-xl text-white px-6 py-4 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] border border-slate-700 flex flex-col md:flex-row items-center gap-4 md:gap-6 pointer-events-auto">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <div>
                     <span className="text-sm font-semibold tracking-wide block">Anda memiliki perubahan data</span>
                     <span className="text-[10px] text-slate-400">Pastikan semua dokumen VDR diunggah dengan benar.</span>
                  </div>
                </div>
                <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full md:w-auto bg-white text-slate-900 hover:bg-indigo-50 px-8 py-3 rounded-2xl font-black text-sm transition-colors shadow-inner flex items-center justify-center gap-2 disabled:opacity-70">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save size={16} />}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </FormProvider>
  );
}

const FormInputError = ({ error }: { error?: any }) => {
  if (!error) return null;
  return <p className="text-[11px] text-red-500 mt-1.5 font-bold animate-in fade-in flex items-center gap-1"><AlertCircle size={12}/> {error.message}</p>;
};

// --- TABS COMPONENTS ---

const TabBranding = () => {
  const { register, formState: { errors } } = useFormContext<any>();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Sparkles size={20} /></div>
        <h3 className="text-xl font-bold text-slate-800">Identitas Brand & Pitch</h3>
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Nama Startup <span className="text-red-500">*</span></label>
        <input {...register('name', { required: 'Nama Startup wajib diisi' })} className={`w-full px-5 py-3.5 bg-slate-50/50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-base font-bold shadow-sm transition-all ${errors.name ? 'border-red-400 bg-red-50/20' : 'border-slate-200/80'}`} placeholder="Masukkan nama resmi startup" />
        <FormInputError error={errors.name} />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Elevator Pitch (Slogan) <span className="text-red-500">*</span></label>
        <input {...register('elevatorPitch', { required: 'Slogan wajib diisi agar mudah diingat investor' })} maxLength={80} className={`w-full px-5 py-3.5 bg-slate-50/50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium shadow-sm transition-all ${errors.elevatorPitch ? 'border-red-400 bg-red-50/20' : 'border-slate-200/80'}`} placeholder="Platform AI untuk efisiensi rantai pasok logistik..." />
        <FormInputError error={errors.elevatorPitch} />
        <p className="text-[10px] text-slate-400 mt-1.5 text-right">Maksimal 80 karakter</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Target size={16} className="text-red-500"/> Problem (Masalah)</label>
          <textarea {...register('problemStatement')} rows={4} className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm shadow-sm transition-all" placeholder="Masalah utama apa yang Anda pecahkan?"></textarea>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500"/> Solution (Solusi)</label>
          <textarea {...register('solutionStatement')} rows={4} className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm shadow-sm transition-all" placeholder="Bagaimana produk Anda memecahkan masalah tersebut?"></textarea>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/50">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Teks Tombol Aksi Utama (CTA)</label>
          <input {...register('primaryCta.text')} className="w-full px-5 py-3.5 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm shadow-sm" placeholder="Misal: Coba Gratis" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Tautan Tombol Aksi</label>
          <input type="url" {...register('primaryCta.url')} className="w-full px-5 py-3.5 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm shadow-sm" placeholder="https://..." />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Palette size={16}/> Warna Tema (Hex)</label>
          <div className="flex gap-4">
            <input type="color" {...register('brandColor')} className="h-12 w-20 rounded-xl cursor-pointer border border-slate-200 p-1 bg-white shadow-sm" />
            <input type="text" {...register('brandColor')} className="flex-1 px-5 py-3 bg-slate-50/50 border border-slate-200/80 rounded-xl outline-none text-sm font-mono uppercase shadow-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><PlaySquare size={16} className="text-red-500"/> URL Video Promo (Opsional)</label>
          <input type="url" {...register('promoVideoUrl')} className="w-full px-5 py-3 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm shadow-sm h-12" placeholder="Link YouTube" />
        </div>
      </div>
    </div>
  );
};

const TabLegalitasVDR = ({ aktaFile, setAktaFile, skFile, setSkFile, hkiFile, setHkiFile, fmFile, setFmFile }: any) => {
  const { register, formState: { errors }, watch, setValue } = useFormContext<any>();
  const formValues = watch();

  const handleVDRUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: any, fieldName: string) => {
    if (e.target.files?.[0]) {
      setter(e.target.files[0]);
      setValue(fieldName, 'changed', { shouldDirty: true });
    }
  };

  return (
    <div className="space-y-8">
      {/* IDENTITAS LEGAL */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Briefcase size={20} /></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Legalitas & Informasi PIC</h3>
            <p className="text-sm text-slate-500">Data ini wajib diisi sebagai syarat penyaluran investasi.</p>
          </div>
        </div>
        
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1">Nama Founder / PIC <span className="text-red-500">*</span></label>
              <input {...register('ownerName', { required: 'Nama PIC wajib diisi' })} className={`w-full px-4 py-3 border rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${errors.ownerName ? 'border-red-400' : 'border-slate-200'}`} placeholder="Nama lengkap sesuai KTP" />
              <FormInputError error={errors.ownerName} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1">No. WhatsApp <span className="text-red-500">*</span></label>
              <input type="tel" {...register('contact', { required: 'Kontak WhatsApp wajib diisi' })} className={`w-full px-4 py-3 border rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${errors.contact ? 'border-red-400' : 'border-slate-200'}`} placeholder="08123456xxxx" />
              <FormInputError error={errors.contact} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1">Sektor Industri <span className="text-red-500">*</span></label>
              <input {...register('sector', { required: 'Sektor Bisnis wajib diisi' })} className={`w-full px-4 py-3 border rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${errors.sector ? 'border-red-400' : 'border-slate-200'}`} placeholder="Misal: Edutech, Agritech" />
              <FormInputError error={errors.sector} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Bentuk Badan Hukum</label>
              <select {...register('legalEntity')} className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="Belum Ada">Belum Ada / Pra-Startup</option>
                  <option value="PT">PT (Perseroan Terbatas)</option>
                  <option value="CV">CV (Commanditaire Vennootschap)</option>
                  <option value="Koperasi">Koperasi</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* VIRTUAL DATA ROOM (VDR) */}
      <div className="space-y-6 pt-6 border-t border-slate-100">
        <div className="flex items-center gap-3 pb-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><FileKey size={20} /></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Virtual Data Room (VDR)</h3>
            <p className="text-sm text-slate-500">Unggah dokumen hukum dan finansial untuk kebutuhan Due Diligence investor. Hanya Admin dan Investor terverifikasi yang dapat mengakses file ini.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Akta Pendirian */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col">
            <h4 className="text-sm font-bold text-slate-800 mb-1">Akta Pendirian Perusahaan</h4>
            <p className="text-[10px] text-slate-500 mb-4">Format PDF. Wajib untuk verifikasi entitas.</p>
            <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 w-full h-24 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center text-xs font-semibold text-slate-500 bg-slate-50 mt-auto">
              <UploadCloud className="w-6 h-6 mb-1 text-indigo-400" />
              {aktaFile ? <span className="text-indigo-600 text-center px-2 truncate w-full">{aktaFile.name}</span> : formValues.vdr?.aktaPendirianUrl ? <span className="text-emerald-600">File Tersimpan (Klik untuk Ganti)</span> : <span>Pilih File PDF</span>}
              <input type="file" accept=".pdf" onChange={e => handleVDRUpload(e, setAktaFile, 'vdr.aktaPendirianUrl')} className="hidden" />
            </label>
          </div>

          {/* SK Kemenkumham */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col">
            <h4 className="text-sm font-bold text-slate-800 mb-1">SK Kemenkumham & NIB</h4>
            <p className="text-[10px] text-slate-500 mb-4">Format PDF. Surat Keputusan Menteri.</p>
            <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 w-full h-24 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center text-xs font-semibold text-slate-500 bg-slate-50 mt-auto">
              <UploadCloud className="w-6 h-6 mb-1 text-indigo-400" />
              {skFile ? <span className="text-indigo-600 text-center px-2 truncate w-full">{skFile.name}</span> : formValues.vdr?.skKemenkumhamUrl ? <span className="text-emerald-600">File Tersimpan (Klik untuk Ganti)</span> : <span>Pilih File PDF</span>}
              <input type="file" accept=".pdf" onChange={e => handleVDRUpload(e, setSkFile, 'vdr.skKemenkumhamUrl')} className="hidden" />
            </label>
          </div>

          {/* HKI & Sertifikasi */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col">
            <h4 className="text-sm font-bold text-slate-800 mb-1">Sertifikat HKI / Paten</h4>
            <p className="text-[10px] text-slate-500 mb-4">Merek Dagang, Hak Cipta, atau Paten Teknologi.</p>
            <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 w-full h-24 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center text-xs font-semibold text-slate-500 bg-slate-50 mt-auto">
              <UploadCloud className="w-6 h-6 mb-1 text-indigo-400" />
              {hkiFile ? <span className="text-indigo-600 text-center px-2 truncate w-full">{hkiFile.name}</span> : formValues.vdr?.hkiSertifikatUrl ? <span className="text-emerald-600">File Tersimpan (Klik untuk Ganti)</span> : <span>Pilih File PDF/IMG</span>}
              <input type="file" accept=".pdf,image/*" onChange={e => handleVDRUpload(e, setHkiFile, 'vdr.hkiSertifikatUrl')} className="hidden" />
            </label>
          </div>

          {/* Financial Model */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col">
            <h4 className="text-sm font-bold text-slate-800 mb-1">Financial Model (Proyeksi)</h4>
            <p className="text-[10px] text-slate-500 mb-4">File spreadsheet proyeksi finansial (3-5 tahun).</p>
            <label className="border-2 border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50/50 w-full h-24 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center text-xs font-semibold text-slate-500 bg-slate-50 mt-auto">
              <UploadCloud className="w-6 h-6 mb-1 text-amber-500" />
              {fmFile ? <span className="text-amber-600 text-center px-2 truncate w-full">{fmFile.name}</span> : formValues.vdr?.financialModelUrl ? <span className="text-emerald-600">File Tersimpan (Klik untuk Ganti)</span> : <span>Pilih File Excel/PDF</span>}
              <input type="file" accept=".pdf,.xlsx,.xls,.csv" onChange={e => handleVDRUpload(e, setFmFile, 'vdr.financialModelUrl')} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

const TabPendanaanCapTable = ({ pitchDeckFile, setPitchDeckFile }: any) => {
  const { register, watch, setValue, control } = useFormContext<any>();
  const isRaising = watch('isRaising');
  const currentNeeds = watch('currentNeeds') || [];

  // Arrays Hooks untuk Cap Table dan Funding Rounds
  const { fields: capFields, append: appendCap, remove: removeCap } = useFieldArray({ control, name: "capTable" });
  const { fields: fundFields, append: appendFund, remove: removeFund } = useFieldArray({ control, name: "fundingRounds" });

  const handleNeedsChange = (need: string) => {
    if (currentNeeds.includes(need)) setValue('currentNeeds', currentNeeds.filter((n: string) => n !== need), { shouldDirty: true });
    else setValue('currentNeeds', [...currentNeeds, need], { shouldDirty: true });
  };

  // Validasi persentase saham (maksimal 100%)
  const totalShares = watch('capTable')?.reduce((acc: number, curr: any) => acc + (Number(curr.ownershipPercentage) || 0), 0) || 0;

  return (
    <div className="space-y-10">
      
      {/* STATUS PENDANAAN & PITCH DECK */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><DollarSign size={20} /></div>
          <h3 className="text-xl font-bold text-slate-800">Status & Kebutuhan Ekosistem</h3>
        </div>
        
        <div className="bg-amber-50/50 border border-amber-200/50 p-6 rounded-2xl flex items-start gap-4">
          <div className="flex-1">
            <h4 className="font-black text-amber-900 mb-1 text-lg">Mencari Pendanaan Baru?</h4>
            <p className="text-sm text-amber-700/80 mb-4">Aktifkan untuk menampilkan badge "Fundraising" secara publik pada direktori Business Matching.</p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" {...register('isRaising')} className="sr-only peer" />
              <div className="w-14 h-7 bg-amber-200/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
              <span className="ml-4 text-sm font-bold text-amber-900">{isRaising ? 'Aktif (Fundraising)' : 'Tidak Aktif'}</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">Kebutuhan Utama Saat Ini (The Asks)</label>
          <div className="flex flex-wrap gap-2.5">
            {['Mencari Investor', 'Mencari Co-Founder', 'Talenta Tech/Programmer', 'B2B Partner', 'Distributor / Reseller', 'Mentorship'].map(need => {
              const isActive = currentNeeds.includes(need);
              return (
                <button type="button" key={need} onClick={() => handleNeedsChange(need)} className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/30'}`}>
                  {isActive && <CheckCircle2 className="inline w-3.5 h-3.5 mr-1.5" />} {need}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><FileText size={16} className="text-amber-500"/> Pitch Deck Terbaru (PDF)</label>
          <label className="border-2 border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50/50 px-6 py-6 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center text-sm font-semibold text-slate-500 group bg-slate-50">
            <UploadCloud className="w-8 h-8 mb-2 text-slate-400 group-hover:text-amber-500 transition-colors" />
            {pitchDeckFile ? <span className="text-amber-600 text-base font-bold">{pitchDeckFile.name}</span> : watch('pitchDeckUrl') ? <span className="text-emerald-600">Dokumen sudah diunggah. Klik untuk mengganti.</span> : <span>Klik atau seret file PDF Pitch Deck ke sini</span>}
            <input type="file" accept=".pdf" onChange={e => { if (e.target.files?.[0]) { setPitchDeckFile(e.target.files[0]); setValue('pitchDeckUrl', 'changed', {shouldDirty: true}); } }} className="hidden" />
          </label>
        </div>
      </div>

      {/* CAP TABLE */}
      <div className="space-y-6 pt-6 border-t border-slate-100">
        <div className="flex justify-between items-center pb-2">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><PieChart className="text-indigo-500" size={20}/> Capitalization Table (Cap Table)</h3>
            <p className="text-sm text-slate-500 mt-1">Alokasi kepemilikan saham perusahaan Anda saat ini.</p>
          </div>
          <button type="button" onClick={() => appendCap({ id: crypto.randomUUID(), name: '', type: 'Founder', ownershipPercentage: 0 })} className="text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
            <Plus size={14}/> Tambah Shareholder
          </button>
        </div>

        <div className="space-y-3">
          {capFields.length === 0 && <div className="text-sm text-slate-400 text-center py-6 border border-dashed rounded-xl bg-slate-50">Belum ada struktur kepemilikan (100% Bootstrapped).</div>}
          {capFields.map((item, index) => (
            <div key={item.id} className="flex gap-3 bg-white p-4 border border-slate-200 rounded-xl shadow-sm items-start relative group">
              <button type="button" onClick={() => removeCap(index)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><X size={12}/></button>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input {...register(`capTable.${index}.name`)} placeholder="Nama Entitas/Orang" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none" />
                <select {...register(`capTable.${index}.type`)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none cursor-pointer">
                  <option value="Founder">Founder</option><option value="Investor">Investor</option><option value="Employee/ESOP">Employee / ESOP</option><option value="Advisor">Advisor</option><option value="Lainnya">Lainnya</option>
                </select>
                <div className="flex items-center gap-2">
                  <input type="number" step="0.01" {...register(`capTable.${index}.ownershipPercentage`, { valueAsNumber: true })} placeholder="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none text-right" />
                  <span className="text-sm font-bold text-slate-500">%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {totalShares > 0 && (
          <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
            <span className="text-sm font-bold text-slate-600">Total Alokasi Saham</span>
            <span className={`text-lg font-black ${totalShares > 100 ? 'text-red-500' : totalShares === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>{totalShares}%</span>
          </div>
        )}
      </div>

      {/* FUNDING ROUNDS */}
      <div className="space-y-6 pt-6 border-t border-slate-100">
        <div className="flex justify-between items-center pb-2">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><TrendingUp className="text-emerald-500" size={20}/> Riwayat Pendanaan (Funding History)</h3>
            <p className="text-sm text-slate-500 mt-1">Daftar putaran pendanaan eksternal yang pernah diraih.</p>
          </div>
          <button type="button" onClick={() => appendFund({ id: crypto.randomUUID(), roundName: 'Seed', date: '', amount: 0, valuation: 0, investors: '' })} className="text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
            <Plus size={14}/> Tambah Round
          </button>
        </div>

        <div className="space-y-4">
          {fundFields.length === 0 && <div className="text-sm text-slate-400 text-center py-6 border border-dashed rounded-xl bg-slate-50">Belum ada riwayat pendanaan eksternal.</div>}
          {fundFields.map((item, index) => (
            <div key={item.id} className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm relative group">
              <button type="button" onClick={() => removeFund(index)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tahap Pendanaan</label>
                  <select {...register(`fundingRounds.${index}.roundName`)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none cursor-pointer">
                    <option value="Pre-Seed">Pre-Seed</option><option value="Seed">Seed</option><option value="Pre-Series A">Pre-Series A</option><option value="Series A">Series A</option><option value="Bridge/Convertible">Bridge / Convertible Note</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Bulan/Tahun (Format: YYYY-MM)</label>
                  <input type="month" {...register(`fundingRounds.${index}.date`)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Jumlah Didapat (Rp)</label>
                  <input type="number" {...register(`fundingRounds.${index}.amount`, { valueAsNumber: true })} placeholder="Nominal Investasi" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-emerald-600 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Post-Money Valuation (Rp - Opsional)</label>
                  <input type="number" {...register(`fundingRounds.${index}.valuation`, { valueAsNumber: true })} placeholder="Valuasi Akhir" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Daftar Lead/Participating Investors</label>
                  <input {...register(`fundingRounds.${index}.investors`)} placeholder="Cth: East Ventures, Alpha JWC (pisahkan dengan koma)" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

const TabMetrik = ({ newClientLogoPreviews, setNewClientLogoFiles, setNewClientLogoPreviews }: any) => {
  const { register, watch, setValue } = useFormContext<any>();
  const keyMetrics = watch('keyMetrics') || [];
  const clientLogos = watch('clientLogos') || [];
  const testimonials = watch('testimonials') || [];

  const handleAddClientLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const compressedFiles = await Promise.all(files.map(f => compressImage(f)));
      setNewClientLogoFiles((prev: any) => [...prev, ...compressedFiles]);
      setNewClientLogoPreviews((prev: any) => [...prev, ...compressedFiles.map(f => URL.createObjectURL(f))]);
      setValue('clientLogos', clientLogos, { shouldDirty: true }); 
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><BarChart size={20} /></div>
        <div><h3 className="text-xl font-bold text-slate-800">Traksi, Klien & Liputan</h3><p className="text-sm text-slate-500">Tingkatkan kepercayaan publik dengan pameran pencapaian.</p></div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="text-base font-bold text-slate-900">Key Metrics (Pertumbuhan)</label>
          <button type="button" onClick={() => setValue('keyMetrics', [...keyMetrics, { label: '', value: '' }], { shouldDirty: true })} disabled={keyMetrics.length >= 4} className="text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
            <Plus size={14}/> Tambah Metrik
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {keyMetrics.length === 0 && <div className="col-span-2 text-sm text-center py-4 text-slate-400 border border-dashed rounded-xl">Belum ada metrik. Tambahkan minimal 1 untuk mencapai Level 3.</div>}
          {keyMetrics.map((_: any, idx: number) => (
            <div key={idx} className="flex gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
              <div className="flex-1 space-y-2">
                <input {...register(`keyMetrics.${idx}.value`)} placeholder="Angka (ex: 10,000+)" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-indigo-600 outline-none" />
                <input {...register(`keyMetrics.${idx}.label`)} placeholder="Label (ex: Pengguna Aktif)" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none" />
              </div>
              <button type="button" onClick={() => setValue('keyMetrics', keyMetrics.filter((_: any, i: number) => i !== idx), { shouldDirty: true })} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center shrink-0"><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <label className="text-base font-bold text-slate-900 mb-1 block">Logo Klien / B2B Partner</label>
        <div className="flex flex-wrap gap-4 items-center mt-4">
          {clientLogos.map((url: string, idx: number) => (
            <div key={`old-${idx}`} className="w-20 h-20 relative bg-white border border-slate-200 rounded-xl flex items-center justify-center group overflow-hidden shadow-sm p-2">
              <img src={url} alt="Client" className="max-w-full max-h-full object-contain" />
              <button type="button" onClick={() => setValue('clientLogos', clientLogos.filter((_: any, i: number) => i !== idx), { shouldDirty: true })} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
            </div>
          ))}
          {newClientLogoPreviews.map((url: string, idx: number) => (
            <div key={`new-${idx}`} className="w-20 h-20 relative bg-white border-2 border-indigo-300 rounded-xl flex items-center justify-center group overflow-hidden shadow-sm p-2">
              <img src={url} alt="New Logo" className="max-w-full max-h-full object-contain opacity-50" />
              <span className="absolute text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded shadow">Baru</span>
              <button type="button" onClick={() => { setNewClientLogoFiles((p:any) => p.filter((_:any, i:any) => i !== idx)); setNewClientLogoPreviews((p:any) => p.filter((_:any, i:any) => i !== idx)); }} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
            </div>
          ))}
          <label className="w-20 h-20 border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-400">
            <Plus size={24} />
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleAddClientLogo} />
          </label>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 mt-6">
        <div className="flex justify-between items-center mb-4">
          <label className="text-base font-bold text-slate-900">Testimoni Pelanggan / Mitra</label>
          <button 
            type="button" 
            onClick={() => setValue('testimonials', [...(testimonials || []), { name: '', role: '', quote: '' }], { shouldDirty: true })} 
            className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-1"
          >
            <Plus size={14}/> Tambah Testimoni
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {(!testimonials || testimonials.length === 0) && (
            <div className="text-sm text-center py-4 text-slate-400 border border-dashed rounded-xl">Belum ada testimoni.</div>
          )}
          {(testimonials || []).map((_: any, idx: number) => (
            <div key={idx} className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3 relative">
              <button type="button" onClick={() => setValue('testimonials', testimonials.filter((_: any, i: number) => i !== idx), { shouldDirty: true })} className="absolute top-3 right-3 text-red-500 bg-red-50 p-1.5 rounded-lg"><Trash2 size={14}/></button>
              <div className="grid grid-cols-2 gap-3 pr-8">
                <input {...register(`testimonials.${idx}.name`)} placeholder="Nama Klien (ex: Budi Santoso)" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                <input {...register(`testimonials.${idx}.role`)} placeholder="Jabatan (ex: CEO PT Maju)" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
              </div>
              <textarea {...register(`testimonials.${idx}.quote`)} rows={2} placeholder="Kutipan testimoni..." className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

const TabKarir = () => {
  const { register, watch, setValue } = useFormContext<any>();
  const [techInput, setTechInput] = useState('');
  const techStack = watch('techStack') || [];
  const jobOpenings = watch('jobOpenings') || [];

  const handleAddTech = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = techInput.trim().replace(/,/g, '');
      if (val && !techStack.includes(val)) {
        setValue('techStack', [...techStack, val], { shouldDirty: true });
      }
      setTechInput('');
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><UserPlus size={20} /></div>
        <div><h3 className="text-xl font-bold text-slate-800">Tim & Teknologi</h3></div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex gap-4 items-start">
         <div className="p-2 bg-blue-100 text-blue-600 rounded-full shrink-0"><AlertCircle size={16}/></div>
         <div>
            <h4 className="text-sm font-bold text-blue-900 mb-1">Informasi Anggota Tim & Founder</h4>
            <p className="text-xs text-blue-800 mb-3">Untuk mengisi daftar Founder dan Anggota Tim, silakan gunakan menu Traction/Milestone.</p>
            <a href="/tenant/traction" className="text-xs font-bold bg-white text-blue-700 px-4 py-2 rounded-lg shadow-sm border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors inline-block">
               Perbarui Susunan Tim →
            </a>
         </div>
      </div>

      <div>
        <label className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2"><Code2 size={16}/> Teknologi yang Digunakan (Tech Stack)</label>
        <p className="text-xs text-slate-500 mb-4">Tekan Enter atau ketik koma (,) untuk menambah teknologi.</p>
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap gap-2 items-center min-h-[56px]">
            {techStack.map((tech: string, idx: number) => (
              <span key={idx} className="bg-slate-100 text-slate-700 text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  {tech}
                  <button type="button" onClick={() => setValue('techStack', techStack.filter((_: any, i: number) => i !== idx), { shouldDirty: true })} className="text-slate-400 hover:text-red-500"><Trash2 size={12}/></button>
              </span>
            ))}
            <input type="text" value={techInput} onChange={e => setTechInput(e.target.value)} onKeyDown={handleAddTech} placeholder="Misal: React, Node.js..." className="flex-1 min-w-[150px] bg-transparent outline-none text-sm px-2 py-1" />
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 mt-6">
        <div className="flex justify-between items-center mb-4">
          <label className="text-base font-bold text-slate-900 flex items-center gap-2"><Briefcase size={16}/> Lowongan Kerja Terbuka</label>
          <button 
            type="button" 
            onClick={() => setValue('jobOpenings', [...(jobOpenings || []), { id: Date.now().toString(), title: '', type: 'Full-time', location: '', url: '' }], { shouldDirty: true })} 
            className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1"
          >
            <Plus size={14}/> Tambah Loker
          </button>
        </div>
        <div className="space-y-4">
          {(jobOpenings || []).map((_: any, idx: number) => (
            <div key={idx} className="bg-white p-4 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-3 relative">
               <button type="button" onClick={() => setValue('jobOpenings', jobOpenings.filter((_: any, i: number) => i !== idx), { shouldDirty: true })} className="absolute -top-2 -right-2 text-white bg-red-500 p-1 rounded-full shadow-md z-10"><X size={12}/></button>
               <input {...register(`jobOpenings.${idx}.title`)} placeholder="Posisi (ex: Frontend Developer)" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" />
               <select {...register(`jobOpenings.${idx}.type`)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                 <option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option><option value="Internship">Internship</option>
               </select>
               <input {...register(`jobOpenings.${idx}.location`)} placeholder="Lokasi (ex: Remote / Solo)" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
               <input {...register(`jobOpenings.${idx}.url`)} placeholder="URL Link Lamaran" type="url" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
            </div>
          ))}
          {(!jobOpenings || jobOpenings.length === 0) && (
            <div className="text-sm text-center py-4 text-slate-400 border border-dashed rounded-xl">Belum ada lowongan pekerjaan.</div>
          )}
        </div>
      </div>

    </div>
  );
};

const TabSosial = () => {
  const { register } = useFormContext<any>();
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Globe size={20} /></div>
        <h3 className="text-xl font-bold text-slate-800">Sosial Media & Link</h3>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Website Utama</label>
          <input type="url" {...register('website')} placeholder="https://..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Linkedin size={16} className="text-[#0A66C2]"/> LinkedIn Company Page</label>
          <input type="url" {...register('socialLinks.linkedin')} placeholder="https://linkedin.com/company/..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none text-sm shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Instagram size={16} className="text-pink-600"/> Instagram Handle</label>
          <input type="text" {...register('socialLinks.instagram')} placeholder="@startup_anda" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none text-sm shadow-sm" />
        </div>
      </div>
    </div>
  );
};

const TabCustom = ({ sectionImagePreviews, setSectionImageUploads, setSectionImagePreviews }: any) => {
  const { register, watch, setValue } = useFormContext<any>();
  const customSections = watch('customSections') || [];

  const handleSectionImageChange = async (id: string, file: File) => {
    const compressedFile = await compressImage(file);
    setSectionImageUploads((p:any) => ({ ...p, [id]: compressedFile }));
    setSectionImagePreviews((p:any) => ({ ...p, [id]: URL.createObjectURL(compressedFile) }));
    setValue('customSections', customSections, { shouldDirty: true }); 
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Layout size={20} /></div>
          <div><h3 className="text-xl font-bold text-slate-800">Builder Halaman Bebas</h3></div>
        </div>
        <button type="button" onClick={() => setValue('customSections', [...customSections, { id: `sec_${Date.now()}`, title: '', content: '', mediaPosition: 'top' }], { shouldDirty: true })} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors">
          <Plus size={16}/> Tambah Blok
        </button>
      </div>

      {customSections.map((sec: any, idx: number) => (
        <div key={sec.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Blok Kustom {idx + 1}</span>
              <button type="button" onClick={() => setValue('customSections', customSections.filter((_: any, i: number) => i !== idx), { shouldDirty: true })} className="text-slate-400 hover:text-red-500 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm"><Trash2 size={14}/></button>
          </div>
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <input {...register(`customSections.${idx}.title`)} placeholder="Judul Seksi (Contoh: Cara Kerja)" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-1 focus:ring-purple-500" />
              <textarea {...register(`customSections.${idx}.content`)} rows={4} placeholder="Konten deskripsi..." className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm resize-none outline-none focus:ring-1 focus:ring-purple-500"></textarea>
            </div>
            <div className="flex flex-col">
              <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl relative flex items-center justify-center bg-slate-50 overflow-hidden min-h-[120px] group">
                {sectionImagePreviews[sec.id] || sec.mediaUrl ? (
                  <>
                    <img src={sectionImagePreviews[sec.id] || sec.mediaUrl} alt="Section" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && handleSectionImageChange(sec.id, e.target.files[0])} />
                    </div>
                  </>
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon className="mx-auto w-8 h-8 mb-2 opacity-50" />
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && handleSectionImageChange(sec.id, e.target.files[0])} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};