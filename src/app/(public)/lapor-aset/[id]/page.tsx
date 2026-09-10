'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssets } from '@/hooks/useAssets';
import { Asset } from '@/types';
import { SectionContainer } from '@/components/ui/SectionContainer';
import { AlertTriangle, UploadCloud, MapPin, Phone, User, X, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function LaporAsetPublikPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params.id as string;

  // Gunakan Custom Hook
  const { getAsset, submitReport } = useAssets();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    reporterName: '',
    reporterContact: '',
    reportedCondition: 'Rusak Ringan',
    currentLocation: '',
    notes: ''
  });

  // Fetch Detail Aset saat halaman dimuat
  useEffect(() => {
    const fetchAsset = async () => {
      setLoading(true);
      const res = await getAsset(assetId);
      if (res.success && res.data) {
        setAsset(res.data);
      } else {
        setErrorMsg("Aset tidak ditemukan atau QR Code tidak valid.");
      }
      setLoading(false);
    };

    if (assetId) fetchAsset();
  }, [assetId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 3) {
      alert('Maksimal hanya 3 foto bukti.');
      return;
    }

    setImages(prev => [...prev, ...files]);
    
    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    setIsSubmitting(true);

    const reportData = {
      assetId: asset.id,
      assetName: asset.name,
      inventoryNumber: asset.inventoryNumber,
      ...form
    };

    const res = await submitReport(reportData, images);

    setIsSubmitting(false);

    if (res.success) {
      setIsSuccess(true);
    } else {
      alert("Gagal mengirim laporan: " + res.error);
    }
  };

  if (loading) {
    return (
      <SectionContainer width="narrow" accent="sky">
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-sky-600 mb-4" />
          <p className="text-slate-500 font-bold text-sm animate-pulse">Memindai data aset...</p>
        </div>
      </SectionContainer>
    );
  }

  if (errorMsg || !asset) {
    return (
      <SectionContainer width="narrow" accent="sky">
        <div className="public-card p-8 sm:p-10 max-w-md w-full mx-auto text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-soft">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Aset Tidak Ditemukan</h2>
          <p className="text-slate-500 text-sm leading-relaxed">{errorMsg}</p>
          <button onClick={() => router.push('/')} className="mt-4 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold w-full transition-all shadow-md">
            Kembali ke Beranda
          </button>
        </div>
      </SectionContainer>
    );
  }

  if (isSuccess) {
    return (
      <SectionContainer width="narrow" accent="sky">
        <div className="public-card p-8 sm:p-10 max-w-md w-full mx-auto text-center space-y-4 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Laporan Terkirim!</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Terima kasih! Laporan Anda mengenai <span className="font-bold text-slate-700">{asset.name}</span> telah diterima dan akan segera ditindaklanjuti oleh teknisi fasilitas teknopark.
          </p>
          <div className="pt-4">
            <button onClick={() => window.location.reload()} className="w-full px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-md">
              Selesai
            </button>
          </div>
        </div>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer width="narrow" accent="sky">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Header Aset */}
        <div className="public-card overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 sm:p-8 text-white flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md">
              <AlertTriangle size={24} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mb-1">Form Laporan Kerusakan</h1>
              <p className="text-slate-300 text-xs sm:text-sm">Bantu kami menjaga fasilitas tetap dalam kondisi prima.</p>
            </div>
          </div>
          
          <div className="p-6 sm:p-7 bg-sky-50/40">
            <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest mb-1.5">Aset yang Dilaporkan</p>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">{asset.name}</h2>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs font-mono font-bold text-sky-800 bg-sky-100/80 px-2.5 py-1 rounded-lg">{asset.inventoryNumber}</span>
              <span className="text-xs font-bold text-slate-600 bg-white shadow-soft px-2.5 py-1 rounded-lg">{asset.location}</span>
            </div>
          </div>
        </div>

        {/* Form Laporan */}
        <form onSubmit={handleSubmit} className="public-card p-6 sm:p-8 space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">1. Informasi Pelapor</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"><User size={14} className="text-slate-400"/> Nama Lengkap *</label>
                <input required type="text" value={form.reporterName} onChange={e => setForm({...form, reporterName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all text-sm shadow-inner" placeholder="Nama Anda" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"><Phone size={14} className="text-slate-400"/> No. WhatsApp *</label>
                <input required type="tel" value={form.reporterContact} onChange={e => setForm({...form, reporterContact: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all text-sm shadow-inner" placeholder="0812xxxxxx" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">2. Detail Kendala</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tingkat Kerusakan *</label>
              <select required value={form.reportedCondition} onChange={e => setForm({...form, reportedCondition: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all text-sm shadow-inner font-medium text-slate-700">
                <option value="Rusak Ringan">Rusak Ringan (Masih bisa digunakan, tapi terganggu)</option>
                <option value="Rusak Berat">Rusak Berat (Tidak bisa digunakan sama sekali)</option>
                <option value="Hilang">Aset Hilang / Tidak Ditemukan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"><MapPin size={14} className="text-slate-400"/> Lokasi Ditemukan *</label>
              <input required type="text" value={form.currentLocation} onChange={e => setForm({...form, currentLocation: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all text-sm shadow-inner" placeholder="Misal: Toilet Lantai 2, Depan Resepsionis..." />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi Masalah *</label>
              <textarea required value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all text-sm resize-none shadow-inner" placeholder="Ceritakan detail kerusakan yang Anda temukan..."></textarea>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">3. Foto Bukti (Opsional, Maks 3)</h3>
            
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden group shadow-soft">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1.5 right-1.5 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {images.length < 3 && (
                <label className="w-24 h-24 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/70 hover:bg-sky-50/50 hover:border-sky-300 hover:text-sky-600 text-slate-400 cursor-pointer transition-all">
                  <UploadCloud size={24} />
                  <span className="text-[10px] font-bold">Upload</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-sky-200 flex items-center justify-center gap-2 disabled:opacity-70">
              {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Mengirim Laporan...</> : 'Kirim Laporan Kerusakan'}
            </button>
          </div>
          
        </form>
      </div>
    </SectionContainer>
  );
}