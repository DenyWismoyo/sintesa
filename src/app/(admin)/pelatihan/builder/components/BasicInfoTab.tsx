// Lokasi file: src/app/pelatihan/builder/components/BasicInfoTab.tsx
import React from 'react';
import { Training } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';

interface TabProps {
  form: Partial<Training>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Training>>>;
  imageFile: File | null;
  setImageFile: React.Dispatch<React.SetStateAction<File | null>>;
}

export default function BasicInfoTab({ form, setForm, imageFile, setImageFile }: TabProps) {
  
  // Fungsi untuk membersihkan file upload dan menghapus preview
  const handleRemoveImage = () => {
    setImageFile(null);
    setForm({ ...form, imageUrl: '' });
  };

  // Menentukan URL preview: jika ada file upload pakai blob, jika tidak pakai URL yang sudah ada di database
  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : form.imageUrl;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Informasi Dasar Kelas</h2>
        <p className="text-sm text-slate-500 mt-1">Isi identitas utama dari kelas atau pelatihan ini.</p>
      </div>
      <hr className="border-slate-100" />

      <div className="space-y-1.5">
        <Label className="text-sm font-bold text-slate-700">Judul Kelas / Pelatihan <span className="text-red-500">*</span></Label>
        <Input 
          required 
          value={form.title} 
          onChange={e=>setForm({...form, title: e.target.value})} 
          className="h-12 rounded-xl" 
          placeholder="Contoh: Masterclass React JS & Tailwind 2024" 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-slate-700">Tipe Kelas</Label>
          <select 
            value={form.type} 
            onChange={e=>setForm({...form, type: e.target.value as any})} 
            className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="Offline">Tatap Muka (Offline)</option>
            <option value="Online Live">Online Live (Zoom)</option>
            <option value="Video Course">Video Course (LMS)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-slate-700">Tingkat Kesulitan</Label>
          <select 
            value={form.level} 
            onChange={e=>setForm({...form, level: e.target.value as any})} 
            className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="Pemula">Pemula</option>
            <option value="Menengah">Menengah</option>
            <option value="Mahir">Mahir</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-slate-700">Kategori Diklat</Label>
          <select 
            value={form.category || 'Umum'} 
            onChange={e=>setForm({...form, category: e.target.value})} 
            className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="Umum">Pilih Kategori...</option>
            <optgroup label="Manufaktur & Rekayasa">
              <option value="Mekanik Manufaktur">Mekanik Manufaktur</option>
              <option value="Desain Manufaktur">Desain Manufaktur</option>
            </optgroup>
            <optgroup label="Pengelasan (Welding)">
              <option value="Welding Manufaktur">Welding Manufaktur</option>
              <option value="Welding Under Water">Welding Under Water</option>
              <option value="Welding Inspektor">Welding Inspektor</option>
            </optgroup>
            <optgroup label="Energi & Migas">
              <option value="Oil and Gas">Oil and Gas (OGSCI)</option>
            </optgroup>
            <optgroup label="Bisnis & Teknologi">
              <option value="Inkubator Bisnis">Inkubator Bisnis</option>
              <option value="IT & Digital">IT & Digital</option>
            </optgroup>
            <optgroup label="Lainnya">
              <option value="Umum">Umum / Lainnya</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Grid Tambahan untuk Sertifikasi & Metode Praktek (Solo Technopark) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-slate-700">Jenis Sertifikasi</Label>
          <select 
            value={form.certificationType || ''} 
            onChange={e=>setForm({...form, certificationType: e.target.value})} 
            className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Tanpa Sertifikasi Khusus</option>
            <option value="Sertifikat Kompetensi BNSP">Sertifikat Kompetensi BNSP</option>
            <option value="Sertifikat OPITO">Sertifikat OPITO</option>
            <option value="Sertifikat POSSI">Sertifikat POSSI</option>
            <option value="Sertifikat Solo Technopark">Sertifikat Solo Technopark</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-slate-700">Metode Pembelajaran</Label>
          <Input 
            value={form.methodology || ''} 
            onChange={e=>setForm({...form, methodology: e.target.value})} 
            className="h-11 rounded-xl" 
            placeholder="Cth: 30% Teori, 70% Praktek Lapangan" 
          />
        </div>
      </div>

      <div className="space-y-1.5 pt-2">
        <Label className="text-sm font-bold text-slate-700">Nomor WhatsApp CS/Admin (Opsional)</Label>
        <Input 
          value={form.contactWhatsapp || ''} 
          onChange={e=>setForm({...form, contactWhatsapp: e.target.value})} 
          className="h-11 rounded-xl" 
          placeholder="Cth: 081234567890" 
        />
        <p className="text-xs text-slate-400 mt-1">Jika diisi, tombol "Tanya via WhatsApp" akan muncul di halaman pendaftaran peserta.</p>
      </div>
      
      <div className="space-y-1.5">
        <Label className="text-sm font-bold text-slate-700">Deskripsi Lengkap</Label>
        <textarea 
          value={form.description} 
          onChange={e=>setForm({...form, description: e.target.value})} 
          rows={6} 
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all" 
          placeholder="Jelaskan secara rinci apa yang akan dipelajari di kelas ini..."
        />
      </div>

      {/* Upload File Poster & Input Video Google Drive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="space-y-2">
          <Label className="text-sm font-bold text-slate-700">Poster / Thumbnail Kelas</Label>
          
          {!previewUrl ? (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors relative h-[200px]">
              <UploadCloud size={32} className="text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-600">Klik untuk mengunggah gambar</p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, atau WEBP (Maks 2MB)</p>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          ) : (
            <div className="relative border border-slate-200 rounded-xl overflow-hidden h-[200px] bg-slate-100 flex items-center justify-center group">
              <img src={previewUrl} alt="Preview Poster" className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  type="button" 
                  onClick={handleRemoveImage}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 flex items-center gap-2 px-4 font-semibold text-sm shadow-lg"
                >
                  <X size={16} /> Hapus Poster
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold text-slate-700">URL Video Promo / Trailer (Opsional)</Label>
          <Input 
            value={form.promoVideoUrl || ''} 
            onChange={e=>setForm({...form, promoVideoUrl: e.target.value})} 
            className="h-11 rounded-xl" 
            placeholder="Link Video Youtube atau Google Drive..." 
          />
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-2">
            <h4 className="text-sm font-bold text-blue-800 flex items-center gap-1.5 mb-1">
              <ImageIcon size={14} /> Tips Menyematkan Google Drive
            </h4>
            <p className="text-xs text-blue-600 leading-relaxed">
              Jika menggunakan Google Drive, pastikan hak akses file (Share) sudah diatur ke <b>"Siapa saja yang memiliki link (Anyone with the link)"</b> sebagai <b>"Pelihat (Viewer)"</b>. Anda cukup menempelkan link *Share* standar tersebut di atas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}