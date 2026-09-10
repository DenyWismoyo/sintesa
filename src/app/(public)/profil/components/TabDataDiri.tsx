'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

import { User, Mail, Phone, Building2, Loader2, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TabDataDiri({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.displayName || '',
    phone: '',
    agency: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      const docRef = doc(db, 'users', user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setForm(prev => ({
          ...prev,
          name: data.name || prev.name,
          phone: data.phone || '',
          agency: data.agency || ''
        }));
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setLoading(true);
    try {
      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: form.name });
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { ...form, email: user.email, updatedAt: Date.now() }, { merge: true });
      toast.success("Profil Diperbarui!", { description: "Data Anda berhasil disimpan." });
    } catch (error) {
      toast.error("Gagal Menyimpan", { description: "Terjadi kesalahan sistem." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-start gap-4 mb-8 relative">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-[1rem] flex items-center justify-center shrink-0 border border-blue-100/50">
          <User size={24} strokeWidth={2.5}/>
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Informasi Pribadi</h3>
          <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">
            Data ini akan digunakan sebagai profil utama Anda dan pengisian otomatis (autofill) saat melakukan pemesanan layanan.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-slate-50/50 p-6 md:p-8 rounded-[2rem] border border-slate-100 space-y-6">
          
          <div className="space-y-2.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Alamat Email (Akun Login)</Label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
              <Input disabled value={user?.email || ''} className="pl-12 h-14 bg-white text-slate-500 font-medium rounded-2xl border-slate-200/60 shadow-sm opacity-70 cursor-not-allowed" />
            </div>
            <p className="text-[10px] text-amber-600 font-bold ml-1">*Email terikat dengan otentikasi dan tidak dapat diubah.</p>
          </div>

          <div className="space-y-2.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</Label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
              <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="pl-12 h-14 bg-white rounded-2xl border-slate-200/60 shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 transition-all font-semibold text-slate-800" placeholder="Nama Lengkap Anda..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">No. WhatsApp / HP</Label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                <Input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="pl-12 h-14 bg-white rounded-2xl border-slate-200/60 shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 transition-all font-semibold text-slate-800" placeholder="0812..." />
              </div>
            </div>
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Instansi / Perusahaan</Label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                <Input value={form.agency} onChange={e => setForm({...form, agency: e.target.value})} className="pl-12 h-14 bg-white rounded-2xl border-slate-200/60 shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 transition-all font-semibold text-slate-800" placeholder="Nama Organisasi (Opsional)" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto rounded-2xl h-14 px-10 font-bold bg-slate-900 hover:bg-blue-600 text-white shadow-lg shadow-slate-900/10 hover:shadow-blue-600/20 transition-all hover:-translate-y-1 duration-300">
            {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </div>
  );
}