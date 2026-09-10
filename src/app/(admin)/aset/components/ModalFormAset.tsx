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

  const inputClassName = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all";
  const labelClassName = "text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">{isEdit ? 'Edit Data Aset' : 'Registrasi Aset Baru'}</h2>
              <p className="text-xs font-bold text-slate-400">Lengkapi informasi inventaris di bawah ini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* BODY FORM */}
        <div className="overflow-y-auto p-8 custom-scrollbar">
          <form id="assetForm" onSubmit={handleSubmit} className="space-y-8">
            
            {/* UPLOAD FOTO */}
            <section className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-full md:w-1/3 shrink-0">
                <label className={labelClassName}>Foto Aset</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl h-48 flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer group relative overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-5 h-5 text-blue-500" />
                      </div>
                      <p className="text-xs font-bold text-slate-500">Unggah Foto</p>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </div>
              
              <div className="w-full flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClassName}>Nomor Inventaris</label>
                    <input required value={form.inventoryNumber} onChange={(e) => setForm({...form, inventoryNumber: e.target.value})} className={inputClassName} placeholder="Cth: INV/2026/001" />
                  </div>
                  <div>
                    <label className={labelClassName}>Nama Aset / Ruangan</label>
                    <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className={inputClassName} placeholder="Cth: Gedung Serbaguna A" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClassName}>Kategori</label>
                    <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className={inputClassName}>
                      {/* PERBAIKAN: Value diubah menjadi Ruangan, tapi label tetap Ruangan / Gedung */}
                      <option value="Ruangan">Ruangan / Gedung</option>
                      <option value="Peralatan Elektronik">Peralatan Elektronik</option>
                      <option value="Kendaraan">Kendaraan</option>
                      <option value="Mebel / Furnitur">Mebel / Furnitur</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClassName}>Lokasi / Penempatan</label>
                    <input required value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} className={inputClassName} placeholder="Cth: Lantai 1 Sayap Kanan" />
                  </div>
                </div>

                {/* KHUSUS RUANGAN: Spesifikasi untuk sinkronisasi ke Menu Booking */}
                {form.category === 'Ruangan' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 mt-2 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-in fade-in">
                    <div className="col-span-1 md:col-span-2 mb-1">
                      <h4 className="text-xs font-bold text-indigo-800 flex items-center gap-1.5"><Info className="w-4 h-4"/> Spesifikasi Ruangan (Tampil di Menu Booking)</h4>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-2 block">Kapasitas (Orang)</label>
                      <input type="number" min="0" value={form.capacity || ''} onChange={(e) => setForm({...form, capacity: Number(e.target.value)})} className={`${inputClassName} !border-indigo-200 focus:!ring-indigo-500`} placeholder="Cth: 50" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-2 block">Fasilitas Utama</label>
                      <input type="text" value={form.facilities} onChange={(e) => setForm({...form, facilities: e.target.value})} className={`${inputClassName} !border-indigo-200 focus:!ring-indigo-500`} placeholder="Cth: AC, Proyektor, WiFi" />
                    </div>
                  </div>
                )}
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* STATUS & PENGADAAN */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
            <section className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-5">
                <BadgeDollarSign className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-indigo-900">Komersialisasi Ruang / Aset</h3>
              </div>

              <div className="flex items-center gap-3 mb-5 p-3 bg-white border border-indigo-100 rounded-xl shadow-sm">
                <input
                  type="checkbox"
                  id="isRentable"
                  checked={form.isRentable}
                  onChange={(e) => setForm({ ...form, isRentable: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="isRentable" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                  Aset/Ruangan ini dapat disewakan kepada publik atau tenant
                </label>
              </div>

              {form.isRentable && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <label className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 block">
                    Harga Sewa Default (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.priceValue}
                    onChange={(e) => setForm({ ...form, priceValue: Number(e.target.value) })}
                    className="w-full md:w-1/2 px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm font-black text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="0"
                  />
                  <p className="text-[10px] text-indigo-500 mt-2 font-medium leading-relaxed">
                    *Catatan: Pemetaan Akuntansi (BAS) untuk pendapatan ruangan ini akan diatur secara terpisah melalui Menu <strong>Booking &gt; Manajemen Ruangan</strong> oleh Admin Keuangan.
                  </p>
                </div>
              )}
            </section>

            {/* KETERANGAN */}
            <section>
              <label className={labelClassName}>Keterangan Tambahan / Spesifikasi</label>
              <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3} className={`${inputClassName} resize-none`} placeholder="Catatan khusus mengenai aset ini (Dimensi, Spesifikasi teknis, dsb)..."></textarea>
            </section>

          </form>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-8 py-5 flex justify-end gap-3 bg-slate-50 border-t border-slate-100 shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            Batal
          </button>
          <button type="submit" form="assetForm" disabled={isSubmitting} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-blue-700 shadow-md shadow-blue-200 disabled:opacity-70 transition-all">
            {isSubmitting ? <><Loader2 className="animate-spin h-4 w-4" /> Memproses...</> : (isEdit ? 'Simpan Perubahan' : 'Simpan Aset Baru')}
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}