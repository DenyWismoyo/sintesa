// Lokasi file: src/app/(admin)/pengaturan/components/TabProfilInstansi.tsx

import React, { useState, useEffect } from 'react';
import { useSetting } from '@/hooks/useSetting'; // <-- Sudah menggunakan hook baru
import { Building2, MapPin, Phone, Mail, Globe, Image as ImageIcon, CheckCircle2, Loader2, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TabProfilInstansi() {
  // Panggil fungsi dari useSetting
  const { profile, isLoadingProfile, saveProfile, isSavingProfile } = useSetting();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  
  // Image State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Mengisi form otomatis jika data dari database sudah termuat
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setWebsite(profile.website || '');
      setDescription(profile.description || '');
      setLogoPreview(profile.logoUrl || null);
    }
  }, [profile]);

  // Fungsi untuk pratinjau (preview) gambar sebelum di-upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran logo terlalu besar (Maksimal 2MB).");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Fungsi ketika tombol 'Simpan Profil Instansi' ditekan
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const profileData = {
      name, email, phone, address, website, description,
      logoUrl: profile?.logoUrl || '' // Gunakan logo lama jika tidak ada upload baru
    };

    const res = await saveProfile(profileData, logoFile);

    if (res.success) {
      toast.success("Profil Instansi Berhasil Disimpan!");
      setLogoFile(null); // Kosongkan file input agar tidak upload ganda di masa depan
    } else {
      toast.error("Gagal menyimpan profil", { description: res.error });
    }
  };

  // Tampilan saat data sedang ditarik dari database
  if (isLoadingProfile) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
        <p className="font-semibold">Memuat Data Profil...</p>
      </div>
    );
  }

  // Tampilan Utama (Form)
  return (
    <div className="animate-in fade-in space-y-8">
      
      <div className="bg-blue-50/50 text-blue-800 px-5 py-4 rounded-2xl text-sm flex items-start gap-3 border border-blue-100">
        <Info className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" />
        <p className="leading-relaxed">
          <b>Profil Instansi ini adalah Induk Data Sistem.</b> Nama, Alamat, dan Logo yang Anda atur di sini akan digunakan secara otomatis pada <b>Kop Surat Tagihan (Invoice), Kwitansi, Laporan PDF</b>, dan seluruh komunikasi resmi aplikasi.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* BAGIAN 1: LOGO & IDENTITAS UTAMA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-4">
            <Label className="text-sm font-black text-slate-800 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-500" /> Logo Resmi Instansi
            </Label>
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col items-center text-center">
              <div className="h-32 w-32 bg-white rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center mb-4 relative group shadow-sm">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Instansi" className="h-full w-full object-contain p-2" />
                ) : (
                  <Building2 className="h-10 w-10 text-slate-300" />
                )}
              </div>
              <div className="w-full">
                <Input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  onChange={handleImageChange} 
                  className="text-xs file:bg-blue-50 file:text-blue-700 file:border-0 file:rounded-md file:px-3 file:py-1.5 file:mr-3 hover:file:bg-blue-100 cursor-pointer h-10 pt-1.5 rounded-xl border-slate-200 bg-white" 
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-3">Format disarankan: PNG Transparan (Maks 2MB).</p>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" /> Nama Instansi / Perusahaan
              </Label>
              <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: BPSDM Provinsi Jawa Barat" className="h-12 rounded-xl bg-slate-50 focus:bg-white text-base font-bold text-slate-800" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Deskripsi Singkat / Slogan</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Contoh: Melayani dengan Sepenuh Hati" className="h-11 rounded-xl bg-slate-50 focus:bg-white" />
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" /> Alamat Lengkap Instansi (Sesuai KOP Surat)
              </Label>
              <textarea 
                required
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                placeholder="Contoh: Jl. Diponegoro No. 22, Bandung..." 
                className="flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 2: KONTAK & KOMUNIKASI */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black text-slate-800 border-b border-slate-100 pb-4">Kontak Resmi & Media</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Resmi
              </Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contoh@instansi.go.id" className="h-11 rounded-xl bg-slate-50 focus:bg-white" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Telepon / WhatsApp
              </Label>
              <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(022) 123456" className="h-11 rounded-xl bg-slate-50 focus:bg-white" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-slate-400" /> Website Utama
              </Label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://www.instansi.go.id" className="h-11 rounded-xl bg-slate-50 focus:bg-white" />
            </div>
          </div>
        </div>

        {/* FOOTER AKSI */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button type="submit" disabled={isSavingProfile} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 shadow-sm shadow-blue-200 font-bold text-base w-full md:w-auto">
            {isSavingProfile ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Menyimpan...</>
            ) : (
              <><CheckCircle2 className="mr-2 h-5 w-5" /> Simpan Profil Instansi</>
            )}
          </Button>
        </div>

      </form>
    </div>
  );
}