'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

import {
  User,
  Mail,
  Phone,
  Building2,
  Loader2,
  Save,
  Sparkles,
  CreditCard,
  MapPin,
  Briefcase,
  Globe,
  Linkedin,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ChangePasswordCard from '@/components/auth/ChangePasswordCard';

interface UserProfileData {
  name: string;
  phone: string;
  nik: string;
  jobTitle: string;
  agency: string;
  city: string;
  bio: string;
  linkedinUrl: string;
  portfolioUrl: string;
}

export default function TabDataDiri({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<UserProfileData>({
    name: user?.displayName || '',
    phone: '',
    nik: '',
    jobTitle: '',
    agency: '',
    city: 'Kota Surakarta',
    bio: '',
    linkedinUrl: '',
    portfolioUrl: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setForm((prev) => ({
            ...prev,
            name: data.name || user?.displayName || prev.name,
            phone: data.phone || '',
            nik: data.nik || '',
            jobTitle: data.jobTitle || data.headline || '',
            agency: data.agency || '',
            city: data.city || 'Kota Surakarta',
            bio: data.bio || '',
            linkedinUrl: data.linkedinUrl || '',
            portfolioUrl: data.portfolioUrl || '',
          }));
        }
      } catch (err) {
        console.error('Gagal memuat profil pengguna:', err);
      }
    };
    fetchProfile();
  }, [user]);

  // Hitung persentase kelengkapan profil (Gamifikasi UX)
  const profileCompletion = useMemo(() => {
    const checks = [
      Boolean(form.name.trim()),
      Boolean(user?.email),
      Boolean(form.phone.trim()),
      Boolean(form.nik.trim()),
      Boolean(form.jobTitle.trim()),
      Boolean(form.agency.trim()),
      Boolean(form.city.trim()),
      Boolean(form.bio.trim()),
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [form, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    // Validasi NIK jika diisi
    if (form.nik.trim() && !/^\d{16}$/.test(form.nik.trim())) {
      toast.error('Format NIK KTP Tidak Valid', {
        description: 'NIK KTP harus terdiri dari 16 digit angka resmi.',
      });
      return;
    }

    setLoading(true);
    try {
      if (auth.currentUser && form.name.trim() !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: form.name.trim() });
      }

      const docRef = doc(db, 'users', user.uid);
      await setDoc(
        docRef,
        {
          ...form,
          name: form.name.trim(),
          phone: form.phone.trim(),
          nik: form.nik.trim(),
          email: user.email,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      toast.success('Profil Berhasil Diperbarui!', {
        description: 'Seluruh informasi akun dan biodata Anda telah tersimpan aman.',
      });
    } catch (error: any) {
      console.error('Gagal update profile:', error);
      toast.error('Gagal Menyimpan Data', {
        description: error?.message || 'Terjadi kesalahan pada server database.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        {/* Header Seksi & Progress Kelengkapan Profil */}
        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Biodata Lengkap Profil
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 leading-relaxed">
                  Data ini dipakai untuk autofill pendaftaran pelatihan, verifikasi sewa fasilitas, dan sertifikat resmi Solo Technopark.
                </p>
              </div>
            </div>

            <div className="text-right sm:shrink-0">
              <span className="text-xs font-bold text-slate-400 block mb-1">
                Kelengkapan Profil
              </span>
              <span className={`text-xl font-black ${profileCompletion >= 80 ? 'text-emerald-600' : profileCompletion >= 50 ? 'text-amber-600' : 'text-slate-700'}`}>
                {profileCompletion}% Lengkap
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                profileCompletion >= 80 ? 'bg-emerald-500' : profileCompletion >= 50 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            
            {/* 1. Baris Akun & Email Login */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Alamat Email (Akun Login)
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    disabled
                    value={user?.email || ''}
                    className="pl-12 h-12 bg-slate-50 text-slate-500 font-medium rounded-2xl border-slate-200 opacity-80 cursor-not-allowed text-xs sm:text-sm"
                  />
                </div>
                <p className="text-[10px] text-amber-600 font-bold ml-1">
                  *Email terikat dengan identitas login Google/Firebase Anda.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  Nama Lengkap Sesuai KTP <span className="text-rose-500">*</span>
                </Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="pl-12 h-12 bg-white rounded-2xl border-slate-200 font-semibold text-slate-800 text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="Nama lengkap Anda..."
                  />
                </div>
              </div>
            </div>

            {/* 2. Baris No HP & NIK KTP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  No. WhatsApp Aktif <span className="text-rose-500">*</span>
                </Label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <Input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="pl-12 h-12 bg-white rounded-2xl border-slate-200 font-semibold text-slate-800 text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="Contoh: 081234567890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  Nomor Induk Kependudukan (NIK KTP)
                </Label>
                <div className="relative group">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <Input
                    type="text"
                    maxLength={16}
                    value={form.nik}
                    onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, '') })}
                    className="pl-12 h-12 bg-white rounded-2xl border-slate-200 font-mono font-semibold text-slate-800 text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="16 Digit Angka NIK..."
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-1">
                  Digunakan untuk validasi otomatis sertifikat BNSP & faktur pajak resmi.
                </p>
              </div>
            </div>

            {/* 3. Baris Profesi & Instansi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  Profesi / Headline Spesialisasi
                </Label>
                <div className="relative group">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <Input
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                    className="pl-12 h-12 bg-white rounded-2xl border-slate-200 font-semibold text-slate-800 text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="Contoh: Welding QA Engineer / Web Developer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  Asal Instansi / Perusahaan / Kampus
                </Label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <Input
                    value={form.agency}
                    onChange={(e) => setForm({ ...form, agency: e.target.value })}
                    className="pl-12 h-12 bg-white rounded-2xl border-slate-200 font-semibold text-slate-800 text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="Contoh: PT Solo Inovasi Mandiri / UNS"
                  />
                </div>
              </div>
            </div>

            {/* 4. Baris Domisili & Tautan Portofolio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  Kota / Domisili Tinggal
                </Label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="pl-12 h-12 bg-white rounded-2xl border-slate-200 font-semibold text-slate-800 text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="Contoh: Surakarta, Jawa Tengah"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  Tautan Profil LinkedIn / Portofolio
                </Label>
                <div className="relative group">
                  <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <Input
                    type="url"
                    value={form.linkedinUrl}
                    onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                    className="pl-12 h-12 bg-white rounded-2xl border-slate-200 font-semibold text-slate-800 text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            </div>

            {/* 5. Bio Ringkas */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                Bio Ringkas / Deskripsi Diri
              </Label>
              <Textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="bg-white rounded-2xl border-slate-200 font-medium text-slate-800 text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
                placeholder="Ceritakan latar belakang teknis, minat inovasi, atau keahlian utama Anda..."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" /> Data diri Anda terenkripsi aman di cloud Solo Technopark.
            </span>

            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto rounded-2xl h-12 px-8 font-bold bg-slate-900 hover:bg-blue-600 text-white shadow-md shadow-slate-900/10 transition-all cursor-pointer"
            >
              {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              {loading ? 'Menyimpan...' : 'Simpan Data Profil'}
            </Button>
          </div>
        </form>
      </div>

      {/* Kartu Ubah Kata Sandi */}
      <ChangePasswordCard />
    </div>
  );
}
