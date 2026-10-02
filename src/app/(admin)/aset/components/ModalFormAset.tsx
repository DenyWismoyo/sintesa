import React, { useState, useEffect } from 'react';
import { Asset, AssetCategory, AssetCondition, AssetStatus } from '@/types';
import { X, Loader2, UploadCloud, Info, BadgeDollarSign } from 'lucide-react';
import { toast } from 'sonner'; // Tambahkan import toast

interface Props {
  assetToEdit: Asset | 'NEW';
  onClose: () => void;
  onSave: (assetData: Partial<Asset>, imageFile: File | null) => Promise<{ success: boolean; error?: string }>;
}

export default function ModalFormAset({ assetToEdit, onClose, onSave }: Props) {
  const isEdit = assetToEdit !== 'NEW';
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [form, setForm] = useState({
    id: '',
    name: '', 
    category: 'Ruangan', // PERBAIKAN: Disamakan dengan query di Booking
    assetType: '', 
    location: '',
    condition: 'Baik' as AssetCondition, 
    status: 'Tersedia' as AssetStatus, 
    inventoryNumber: '',
    registerNumber: '',
    brandType: '',
    material: '',
    dimensions: '',
    priceValue: 0,
    isRentable: false, 
    acquisitionYear: new Date().getFullYear().toString(), 
    fundingSource: '', 
    description: '',
    capacity: 0, 
    facilities: '' 
  });

  useEffect(() => {
    if (isEdit && typeof assetToEdit !== 'string') {
      setForm({
        ...form,
        ...assetToEdit,
        // Konversi tipe lama "Ruangan / Gedung" menjadi "Ruangan" secara otomatis
        category: assetToEdit.category === 'Ruangan / Gedung' ? 'Ruangan' : assetToEdit.category,
        capacity: assetToEdit.capacity || 0,
        facilities: assetToEdit.facilities || ''
      });
      if (assetToEdit.imageUrl) {
        setPreviewUrl(assetToEdit.imageUrl);
      }
    }
  }, [assetToEdit]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const submitData: any = {
        ...form,
        priceValue: Number(form.priceValue),
        capacity: Number(form.capacity) || 0,
      };

      if (!submitData.id) {
        delete submitData.id;
      }

      const res = await onSave(submitData, imageFile);
      
      if (!res.success) {
        toast.error("Gagal menyimpan aset: " + res.error);
        setIsSubmitting(false);
      } else {
        // PERBAIKAN: Tutup modal dan tampilkan notifikasi sukses
        toast.success(isEdit ? "Perubahan aset berhasil disimpan!" : "Aset/Ruangan baru berhasil ditambahkan!");
        setIsSubmitting(false);
        onClose(); // <-- Ini mencegah admin klik simpan berkali-kali
      }
    } catch (error: any) {
      console.error("System Error during save:", error);
      toast.error("Terjadi kesalahan sistem: " + error.message);
      setIsSubmitting(false);
    }
  };

  const inputClassName = "w-full px-3 py-2 sm:py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all";
  const labelClassName = "text-[11px] sm:text-xs font-bold text-slate-600 mb-1 block";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[95vw] sm:max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden border border-slate-200/80">
        
        {/* HEADER */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-150 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-50 text-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-800">{isEdit ? 'Edit Data Aset' : 'Registrasi Aset Baru'}</h2>
              <p className="text-[11px] font-medium text-slate-400 hidden sm:block">Lengkapi informasi inventaris di bawah ini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* BODY FORM */}
        <div className="overflow-y-auto p-3.5 sm:p-6 no-scrollbar flex-1">
          <form id="assetForm" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            
            {/* UPLOAD FOTO */}
            <section className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
              <div className="w-full md:w-1/3 shrink-0">
                <label className={labelClassName}>Foto Aset (16:9)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl aspect-video w-full flex flex-col items-center justify-center bg-slate-50/70 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer group relative overflow-hidden shadow-2xs">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-xs mb-1.5 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-4 h-4 text-blue-500" />
                      </div>
                      <p className="text-[11px] font-bold text-slate-500">Unggah Foto</p>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </div>
              
              <div className="w-full flex-1 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className={labelClassName}>Nomor Inventaris</label>
                    <input required value={form.inventoryNumber} onChange={(e) => setForm({...form, inventoryNumber: e.target.value})} className={inputClassName} placeholder="Cth: INV/2026/001" />
                  </div>
                  <div>
                    <label className={labelClassName}>Nama Aset / Ruangan</label>
                    <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className={inputClassName} placeholder="Cth: Ruang Rapat Utama" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className={labelClassName}>Kategori</label>
                    <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className={inputClassName}>
                      <option value="Ruangan">Ruangan / Gedung</option>
                      <option value="Peralatan Elektronik">Peralatan Elektronik</option>
                      <option value="Kendaraan">Kendaraan</option>
                      <option value="Mebel / Furnitur">Mebel / Furnitur</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClassName}>Lokasi / Penempatan</label>
                    <input required value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} className={inputClassName} placeholder="Cth: Gedung A Lt. 2" />
                  </div>
                </div>

                {/* KHUSUS RUANGAN: Spesifikasi untuk sinkronisasi ke Menu Booking */}
                {form.category === 'Ruangan' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl animate-in fade-in">
                    <div className="col-span-1 sm:col-span-2">
                      <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-indigo-600"/> Spesifikasi Ruangan</h4>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-indigo-800 mb-1 block">Kapasitas (Orang)</label>
                      <input type="number" min="0" value={form.capacity || ''} onChange={(e) => setForm({...form, capacity: Number(e.target.value)})} className={`${inputClassName} !border-indigo-200 focus:!ring-indigo-500`} placeholder="Cth: 50" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-indigo-800 mb-1 block">Fasilitas Utama</label>
                      <input type="text" value={form.facilities} onChange={(e) => setForm({...form, facilities: e.target.value})} className={`${inputClassName} !border-indigo-200 focus:!ring-indigo-500`} placeholder="Cth: AC, Proyektor, WiFi" />
                    </div>
                  </div>
                )}
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* STATUS & PENGADAAN */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className={labelClassName}>Kondisi Fisik</label>
                <select value={form.condition} onChange={(e) => setForm({...form, condition: e.target.value as AssetCondition})} className={inputClassName}>
                  <option value="Baik">Baik</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                </select>
              </div>
              <div>
                <label className={labelClassName}>Tahun Pengadaan</label>
                <input type="number" value={form.acquisitionYear} onChange={(e) => setForm({...form, acquisitionYear: e.target.value})} className={inputClassName} placeholder="YYYY" />
              </div>
              <div>
                <label className={labelClassName}>Sumber Dana</label>
                <input value={form.fundingSource} onChange={(e) => setForm({...form, fundingSource: e.target.value})} className={inputClassName} placeholder="Cth: APBD / Hibah" />
              </div>
            </section>

            {/* BAGIAN KOMERSIAL */}
            <section className="bg-indigo-50/60 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                <BadgeDollarSign className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-xs sm:text-sm text-indigo-950">Komersialisasi Ruang / Aset</h3>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-white/90 border border-indigo-100 rounded-lg shadow-2xs">
                <input
                  type="checkbox"
                  id="isRentable"
                  checked={form.isRentable}
                  onChange={(e) => setForm({ ...form, isRentable: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="isRentable" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  Aset/Ruangan ini dapat disewakan kepada publik atau tenant
                </label>
              </div>

              {form.isRentable && (
                <div className="mt-3 animate-in fade-in slide-in-from-bottom-2">
                  <label className="text-[11px] font-bold text-indigo-800 mb-1 block">
                    Harga Sewa Default (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.priceValue}
                    onChange={(e) => setForm({ ...form, priceValue: Number(e.target.value) })}
                    className="w-full sm:w-1/2 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              )}
            </section>

            {/* KETERANGAN */}
            <section>
              <label className={labelClassName}>Keterangan Tambahan / Spesifikasi</label>
              <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2} className={`${inputClassName} resize-none`} placeholder="Catatan khusus mengenai aset ini..."></textarea>
            </section>

          </form>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-4 py-2.5 sm:px-6 sm:py-3.5 flex justify-end gap-2 bg-white border-t border-slate-150 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
            Batal
          </button>
          <button type="submit" form="assetForm" disabled={isSubmitting} className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 hover:bg-blue-700 shadow-xs disabled:opacity-70 transition-all">
            {isSubmitting ? <><Loader2 className="animate-spin h-3.5 w-3.5" /> Memproses...</> : (isEdit ? 'Simpan Perubahan' : 'Simpan Aset')}
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}