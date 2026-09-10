'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, Loader2, Save, Info, Megaphone, DollarSign, LayoutList, Users, ClipboardCheck } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTraining } from '@/hooks/useTraining';
import { Training } from '@/types';
import { toast } from 'sonner';
import { canPerformAction, PERMISSIONS } from '@/config/roles';

import BasicInfoTab from './components/BasicInfoTab';
import MarketingTab from './components/MarketingTab';
import PricingTab from './components/PricingTab';
import CurriculumTab from './components/CurriculumTab';
import TeamFaqTab from './components/TeamFaqTab';
import RegistrationTab from './components/RegistrationTab';

export default function PelatihanBuilderPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('id');

  const { addTraining, updateTraining, uploadImage } = useTraining();
  
  const [activeTab, setActiveTab] = useState<'info' | 'marketing' | 'pricing' | 'curriculum' | 'team' | 'registration'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // FIX GARIS MERAH: Menggunakan MANAGE_LMS
  const canManageLMS = canPerformAction(role, PERMISSIONS.MANAGE_LMS);
  const [isInstructor, setIsInstructor] = useState(false);

  const [form, setForm] = useState<Partial<Training>>({
    title: '', description: '', type: 'Offline', level: 'Pemula', category: 'Umum',
    isFree: true, price: 0, quota: 0, date: '', location: '', status: 'Draft',
    targetAudience: [], prerequisites: [], skillsGained: [], benefits: [],
    curriculum: [], instructors: [], faqs: [], registrationFields: [], 
    instructorAccessCode: '', authorizedInstructorIds: []
  });

  useEffect(() => {
    if (authLoading) return; 

    if (!user) {
      router.push('/login');
      return;
    }

    if (editId) {
      const fetchFreshData = async () => {
        try {
          const docRef = doc(db, 'trainings', editId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() } as Training;
            
            const isUserAuthorizedInstructor = data.authorizedInstructorIds?.includes(user?.uid || '');
            
            if (!canManageLMS && !isUserAuthorizedInstructor) {
              toast.error("Akses Ditolak", { description: "Anda tidak berhak mengedit kelas ini." });
              router.push(role === 'public' ? '/lms/dashboard' : '/pelatihan');
              return;
            }

            if (!canManageLMS && isUserAuthorizedInstructor) {
              setIsInstructor(true);
              setActiveTab('curriculum'); 
            }

            setForm(data);
          }
        } catch (error) {
          console.error("Gagal mengambil data:", error);
        }
      };

      fetchFreshData();
    } else if (!canManageLMS && user) {
      toast.error("Akses Ditolak", { description: "Anda tidak memiliki izin membuat kelas baru." });
      router.push('/lms/dashboard');
    }
  }, [editId, canManageLMS, user, role, authLoading, router]);

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  const handleSave = async () => {
    if (!form.title && !isInstructor) return toast.error("Judul Pelatihan Wajib Diisi!");
    
    setIsSubmitting(true);
    let finalImageUrl = form.imageUrl;

    if (imageFile && canManageLMS) {
      toast.info("Mengunggah poster kelas...");
      const uploadRes = await uploadImage(imageFile);
      if (uploadRes.success && uploadRes.url) {
        finalImageUrl = uploadRes.url;
      } else {
        toast.error("Gagal mengunggah poster");
        setIsSubmitting(false); return;
      }
    }
    
    const finalData = { ...form, imageUrl: finalImageUrl };
    if (!isInstructor && form.isFree) finalData.price = 0;

    let res;
    if (editId) {
      res = await updateTraining(editId, finalData);
    } else if (canManageLMS) {
      res = await addTraining(finalData as any);
    }

    setIsSubmitting(false);

    if (res?.success) {
      toast.success(editId ? "Pembaruan Disimpan!" : "Kelas Dibuat!");
      if (isInstructor) router.push('/lms/dashboard');
      else router.push('/pelatihan');
    } else {
      toast.error("Gagal Menyimpan", { description: res?.error });
    }
  };

  return (
    <div className="w-full space-y-6 pb-24 animate-in fade-in duration-300">
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 sticky top-4 z-40 transition-all">
        <div className="flex items-center gap-5">
          <button onClick={() => router.push(isInstructor ? '/lms/dashboard' : '/pelatihan')} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all shrink-0"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight mb-1">{isInstructor ? 'Mode Instruktur: Susun Kurikulum' : editId ? 'Pengaturan Kelas (LMS)' : 'Buat Kelas Baru'}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{form.title || 'Judul Belum Diisi'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {canManageLMS && (
            <select value={form.status} onChange={e=>setForm({...form, status: e.target.value as any})} className="h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"><option value="Draft">Draft (Tersembunyi)</option><option value="Published">Publish (Live Publik)</option></select>
          )}
          <button onClick={handleSave} disabled={isSubmitting} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-all text-white disabled:opacity-70 ${isInstructor ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-2 relative">
          <div className="sticky top-28 space-y-2 bg-white p-3 rounded-3xl border border-slate-200 shadow-sm">
            {canManageLMS && (
              <><button onClick={() => setActiveTab('info')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-left transition-all ${activeTab === 'info' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}><Info size={16} /> Info Dasar</button><button onClick={() => setActiveTab('marketing')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-left transition-all ${activeTab === 'marketing' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}><Megaphone size={16} /> Pemasaran</button><button onClick={() => setActiveTab('pricing')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-left transition-all ${activeTab === 'pricing' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}><DollarSign size={16} /> Harga & Logistik</button></>
            )}
            <button onClick={() => setActiveTab('curriculum')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-left transition-all ${activeTab === 'curriculum' ? (isInstructor ? 'bg-indigo-50 text-indigo-700 shadow-sm border-indigo-100' : 'bg-blue-50 text-blue-700 shadow-sm border-blue-100') : 'text-slate-500 hover:bg-slate-50 border-transparent'}`}><LayoutList size={16} /> Kurikulum Materi</button>
            <button onClick={() => setActiveTab('team')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-left transition-all ${activeTab === 'team' ? (isInstructor ? 'bg-indigo-50 text-indigo-700 shadow-sm border-indigo-100' : 'bg-blue-50 text-blue-700 shadow-sm border-blue-100') : 'text-slate-500 hover:bg-slate-50 border-transparent'}`}><Users size={16} /> Instruktur & FAQ</button>
            {canManageLMS && (
              <button onClick={() => setActiveTab('registration')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-left transition-all ${activeTab === 'registration' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}><ClipboardCheck size={16} /> Pendaftaran</button>
            )}
          </div>
        </div>

        <div className="flex-1 bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-sm min-h-[600px] overflow-hidden">
          {activeTab === 'info' && canManageLMS && <BasicInfoTab form={form} setForm={setForm} imageFile={imageFile} setImageFile={setImageFile} />}
          {activeTab === 'marketing' && canManageLMS && <MarketingTab form={form} setForm={setForm} />}
          {activeTab === 'pricing' && canManageLMS && <PricingTab form={form} setForm={setForm} />}
          {activeTab === 'curriculum' && <CurriculumTab form={form} setForm={setForm} />}
          {activeTab === 'team' && <TeamFaqTab form={form} setForm={setForm} editId={editId} isInstructor={isInstructor} />}
          {activeTab === 'registration' && canManageLMS && <RegistrationTab form={form} setForm={setForm} editId={editId} />}
        </div>
      </div>
    </div>
  );
}