'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTenants, useTenantProducts } from '@/hooks/useTenants';
import { tenantService } from '@/services/tenant.service';
import { StartupProduct } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Package, ExternalLink, Trash2, X, UploadCloud, Image as ImageIcon, Edit3, Tag, Layers, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantProductsPage() {
  const { user } = useAuth();
  const { useTenantProfile } = useTenants();
  
  // PERBAIKAN: Gunakan email ATAU uid untuk Anonymous Login
  const { data: profile, isLoading: isProfileLoading } = useTenantProfile(user?.email || user?.uid);
  
  const { products, isLoading: isProductsLoading, addProduct, updateProduct, removeProduct } = useTenantProducts(profile?.id);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'info' | 'fitur' | 'media'>('info');
  const [formData, setFormData] = useState<Partial<StartupProduct>>({
    name: '', description: '', productUrl: '', callToActionText: 'Kunjungi Website',
    category: '', businessModel: '', status: '', features: []
  });
  
  const [featureInput, setFeatureInput] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const ensureAbsoluteUrl = (url?: string) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  const handleOpenDrawer = (product?: StartupProduct) => {
    if (product) {
      setEditingId(product.id!);
      setFormData({ ...product, features: product.features || [] });
      setExistingImages(product.images || []);
      setImageFiles([]); setImagePreviews([]);
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', productUrl: '', callToActionText: 'Kunjungi Website', category: '', businessModel: '', status: '', features: [] });
      setImageFiles([]); setImagePreviews([]); setExistingImages([]);
    }
    setActiveTab('info'); 
    setIsDrawerOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...files]);
      setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    }
  };

  const removePreview = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };
  const removeExistingImage = (index: number) => setExistingImages(prev => prev.filter((_, i) => i !== index));

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setFormData(prev => ({ ...prev, features: [...(prev.features || []), featureInput.trim()] }));
    setFeatureInput('');
  };
  const removeFeature = (index: number) => setFormData(prev => ({ ...prev, features: prev.features?.filter((_, i) => i !== index) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tenantId = profile?.id;
    if (!tenantId) return;
    
    setIsSubmitting(true);
    try {
      let newImageUrls: string[] = [];
      for (const file of imageFiles) {
        newImageUrls.push(await tenantService.uploadFile(tenantId, file, 'products'));
      }
      const finalImages = [...existingImages, ...newImageUrls];
      const payload = { ...formData, images: finalImages };

      if (editingId) {
        await updateProduct.mutateAsync({ productId: editingId, data: payload });
        toast.success("Produk berhasil diperbarui!");
      } else {
        await addProduct.mutateAsync(payload as Omit<StartupProduct, 'id'>);
        toast.success("Produk baru berhasil ditambahkan!");
      }
      setIsDrawerOpen(false);
    } catch (error: any) {
      toast.error("Gagal menyimpan produk", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk/portofolio ini?')) return;
    try { await removeProduct.mutateAsync(productId); toast.success("Produk berhasil dihapus!"); } 
    catch (error) { toast.error("Gagal menghapus produk"); }
  };

  if (isProfileLoading || isProductsLoading) {
    return <div className="flex h-[70vh] items-center justify-center w-full"><Loader2 className="animate-spin h-10 w-10 text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-8 w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-2xl shadow-inner"><Package size={28} /></div> 
            Katalog Produk
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Pamerkan portofolio, inovasi layanan, atau aplikasi andalan startup Anda ke publik.</p>
        </div>
        <button onClick={() => handleOpenDrawer()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 shrink-0 group hover:scale-105">
          <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Tambah Portofolio
        </button>
      </div>

      {!profile ? (
        <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-slate-200/50 py-24 flex flex-col items-center justify-center text-center px-4 w-full">
          <Package size={48} className="text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Profil Belum Lengkap</h3>
          <p className="text-slate-500 text-sm max-w-md">Lengkapi Profil Anda terlebih dahulu di menu "Profil Publik" untuk mengakses fitur Portofolio.</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-dashed border-slate-300 py-24 flex flex-col items-center justify-center text-center px-4 w-full group">
          <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-inner"><Package size={48} /></div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Etalase Masih Kosong</h3>
          <p className="text-slate-500 text-base max-w-md mb-8">Tambahkan portofolio atau produk andalan startup Anda agar menarik perhatian calon klien dan investor.</p>
          <button onClick={() => handleOpenDrawer()} className="text-indigo-600 font-bold hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-6 py-3 rounded-2xl text-sm flex items-center gap-2 transition-colors"><Plus size={18}/> Mulai Tambah Produk</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full auto-rows-max">
          {products.map(product => (
            <motion.div 
              key={product.id} 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white/80 backdrop-blur-lg rounded-[2rem] border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(79,70,229,0.1)] transition-all duration-300 overflow-hidden flex flex-col group relative"
            >
              
              <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button onClick={() => handleOpenDrawer(product)} className="w-10 h-10 bg-white/90 backdrop-blur-md text-slate-700 hover:text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-all"><Edit3 size={16} /></button>
                <button onClick={() => handleDelete(product.id!)} className="w-10 h-10 bg-white/90 backdrop-blur-md text-red-500 hover:text-red-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-all"><Trash2 size={16} /></button>
              </div>

              <div className="h-60 bg-slate-100 relative overflow-hidden shrink-0 p-2">
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50 border border-dashed border-slate-200"><ImageIcon size={48} className="mb-3 opacity-40"/> <span className="text-xs font-bold uppercase tracking-widest">Tanpa Gambar</span></div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                </div>
                
                <div className="absolute bottom-5 left-5 flex flex-col items-start gap-2 pointer-events-none z-10">
                  {product.category && <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm">{product.category}</span>}
                  {product.status && <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm">{product.status}</span>}
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2" title={product.name}>{product.name}</h3>
                {product.businessModel && <p className="text-xs font-bold text-indigo-600 mb-3 flex items-center gap-1.5"><Tag size={12}/> {product.businessModel}</p>}
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-6 flex-1">{product.description}</p>
                
                {product.productUrl && (
                  <a href={ensureAbsoluteUrl(product.productUrl)} target="_blank" rel="noopener noreferrer" className="mt-auto flex items-center justify-center gap-2 w-full py-3.5 bg-slate-50/80 hover:bg-indigo-50 border border-slate-200/60 text-indigo-700 font-bold text-sm rounded-2xl transition-all group/btn">
                    {product.callToActionText || 'Kunjungi Link'} <ExternalLink size={16} className="group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40" 
              onClick={() => setIsDrawerOpen(false)} 
            />
            
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-2xl bg-[#F8FAFC] shadow-2xl z-50 flex flex-col border-l border-white/50"
            >
              
              <div className="px-8 py-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingId ? 'Edit Portofolio' : 'Tambah Portofolio'}</h2>
                  <p className="text-sm text-slate-500 mt-1">Lengkapi etalase produk Anda di sini.</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full flex items-center justify-center transition-colors"><X size={20}/></button>
              </div>
              
              <div className="flex px-8 pt-3 gap-8 bg-white border-b border-slate-100 shrink-0 overflow-x-auto custom-scrollbar">
                {[
                  { id: 'info', label: '1. Info Dasar' },
                  { id: 'fitur', label: '2. Detail & Fitur' },
                  { id: 'media', label: '3. Galeri Media' }
                ].map((tab) => (
                  <button 
                    key={tab.id} onClick={() => setActiveTab(tab.id as any)} 
                    className={`pb-4 text-sm font-bold border-b-[3px] transition-colors whitespace-nowrap relative ${activeTab === tab.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                    
                    {activeTab === 'info' && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Nama Produk / Layanan <span className="text-red-500">*</span></label>
                          <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-base shadow-sm transition-all" placeholder="Contoh: Sistem IoT Monitoring Pintar..." />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi Lengkap <span className="text-red-500">*</span></label>
                          <textarea required rows={6} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm leading-relaxed shadow-sm transition-all" placeholder="Ceritakan detail produk/layanan Anda..."></textarea>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Tautan Publik (Opsional)</label>
                            <input type="url" value={formData.productUrl || ''} onChange={e => setFormData({...formData, productUrl: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="https://..." />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Teks Tombol Tautan</label>
                            <input type="text" value={formData.callToActionText || ''} onChange={e => setFormData({...formData, callToActionText: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Misal: Coba Gratis" />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'fitur' && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Kategori Industri</label>
                            <input type="text" list="cat-options" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm" placeholder="Pilih..." />
                            <datalist id="cat-options"><option value="SaaS / Software"/><option value="Hardware / IoT"/><option value="Jasa B2B"/><option value="Aplikasi Mobile"/></datalist>
                          </div>
                          <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Status Rilis</label>
                            <input type="text" list="stat-options" value={formData.status || ''} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm" placeholder="Pilih..." />
                            <datalist id="stat-options"><option value="Live / Rilis Publik"/><option value="Beta Testing"/><option value="Tahap MVP"/></datalist>
                          </div>
                          <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Model Bisnis</label>
                            <input type="text" list="biz-options" value={formData.businessModel || ''} onChange={e => setFormData({...formData, businessModel: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm" placeholder="Pilih..." />
                            <datalist id="biz-options"><option value="Berlangganan (SaaS)"/><option value="Sekali Bayar"/><option value="B2B Custom"/><option value="Freemium"/></datalist>
                          </div>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-sm">
                          <label className="block text-lg font-black text-slate-900 mb-1 flex items-center gap-2"><Layers size={20} className="text-indigo-500"/> Fitur Unggulan (Key Features)</label>
                          <p className="text-sm text-slate-500 mb-6">Highlight poin-poin terbaik dari produk Anda.</p>
                          
                          <div className="flex gap-3 mb-6">
                            <input type="text" value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())} className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-500 transition-colors" placeholder="Ketik fitur lalu tekan Enter..." />
                            <button type="button" onClick={addFeature} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl text-sm font-bold shadow-md">Tambah</button>
                          </div>
                          
                          <div className="space-y-3">
                            {formData.features?.length === 0 && <div className="text-sm text-slate-400 font-semibold text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">Belum ada fitur ditambahkan.</div>}
                            {formData.features?.map((feat, idx) => (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100 px-5 py-4 rounded-2xl text-sm text-indigo-900 font-bold shadow-sm">
                                <span className="flex items-center gap-3"><CheckCircle2 size={18} className="text-indigo-500 shrink-0"/> {feat}</span>
                                <button type="button" onClick={() => removeFeature(idx)} className="text-slate-400 hover:text-red-500 bg-white p-1.5 rounded-lg shadow-sm"><X size={16}/></button>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'media' && (
                      <div className="space-y-6">
                        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex gap-4 text-indigo-900 text-sm">
                          <Info className="shrink-0 mt-0.5 text-indigo-500" size={20} />
                          <p className="leading-relaxed">Unggah screenshot UI atau foto produk Anda. <strong>Gambar pertama akan dijadikan sebagai Cover Utama.</strong></p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                          {existingImages.map((url, idx) => (
                            <div key={`exist-${idx}`} className="relative aspect-square rounded-[1.5rem] border border-slate-200 overflow-hidden group shadow-sm bg-white">
                              <img src={url} alt={`Existing ${idx}`} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-3 right-3 bg-red-500 text-white rounded-xl p-2 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"><X size={16} /></button>
                            </div>
                          ))}
                          {imagePreviews.map((preview, idx) => (
                            <div key={`new-${idx}`} className="relative aspect-square rounded-[1.5rem] border-2 border-indigo-300 overflow-hidden group shadow-sm bg-white">
                              <img src={preview} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                              <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-md">Baru</div>
                              <button type="button" onClick={() => removePreview(idx)} className="absolute top-3 right-3 bg-red-500 text-white rounded-xl p-2 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"><X size={16} /></button>
                            </div>
                          ))}
                          <label className="aspect-square border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all text-slate-500 group bg-white shadow-sm">
                            <div className="w-14 h-14 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center transition-colors shadow-sm">
                              <UploadCloud size={28} className="group-hover:text-indigo-600 text-slate-400 transition-colors" />
                            </div>
                            <span className="text-sm font-bold text-center group-hover:text-indigo-600 transition-colors">Tambah Foto</span>
                            <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                          </label>
                        </div>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-4 shrink-0">
                <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
                <button onClick={handleSubmit} disabled={isSubmitting || !formData.name || !formData.description} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-500/30 disabled:opacity-70 disabled:shadow-none flex items-center gap-2 transition-all">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : null} {editingId ? 'Simpan Perubahan' : 'Publish Portofolio'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}