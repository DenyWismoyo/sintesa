// Lokasi file: src/app/(admin)/katalog/components/ModalFormProduct.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ProductCatalog, BundleItem, Asset } from '@/types';
import { UploadCloud, Loader2, Plus, Trash2, AlertCircle, Info, Tag, Settings, Image as ImageIcon, CheckCircle2, Package, Search, Calculator } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Firestore
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface ModalFormProductProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ProductCatalog>, imageFiles: File[]) => Promise<void>;
  initialData?: ProductCatalog | null;
}

export default function ModalFormProduct({ isOpen, onClose, onSubmit, initialData }: ModalFormProductProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State untuk Tab Aktif
  const [activeTab, setActiveTab] = useState<'info' | 'bundle' | 'detail' | 'aksi' | 'galeri'>('info');
  
  // State Formulir Utama
  const [formData, setFormData] = useState<Partial<ProductCatalog>>({
    name: '', category: '', price: 0, pricingType: 'Per Hari', 
    shortDescription: '', description: '', isPublished: true, isNegotiable: false,
    ownerType: 'INTERNAL', tenantName: '', ctaType: 'WHATSAPP', ctaText: 'Hubungi Kami', ctaLink: '', images: [],
    productType: 'SINGLE', isPriceCalculated: false, bundleItems: []
  });

  // State Array Dinamis
  const [specifications, setSpecifications] = useState<{label: string, value: string}[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState<string>('');
  
  // State Bundle/Paket
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Asset[]>([]);
  const [isFetchingRooms, setIsFetchingRooms] = useState(false);
  const [newBundleItem, setNewBundleItem] = useState<Partial<BundleItem>>({ type: 'CUSTOM_SERVICE', qty: 1, unitPrice: 0, name: '', isRequired: true });

  // State Galeri
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setSpecifications(initialData.specifications || []);
      setHighlights(initialData.highlights || []);
      setTagsInput(initialData.tags?.join(', ') || '');
      setExistingImages(initialData.images || []);
      setBundleItems(initialData.bundleItems || []);
    } else {
      setFormData({ 
        name: '', category: '', price: 0, pricingType: 'Per Hari', 
        shortDescription: '', description: '', isPublished: true, isNegotiable: false,
        ownerType: 'INTERNAL', tenantName: '', ctaType: 'WHATSAPP', ctaText: 'Hubungi Kami', ctaLink: '', images: [],
        productType: 'SINGLE', isPriceCalculated: false, bundleItems: []
      });
      setSpecifications([]);
      setHighlights([]);
      setTagsInput('');
      setExistingImages([]);
      setBundleItems([]);
    }
    setActiveTab('info');
    setNewImageFiles([]);
    setNewImagePreviews([]);
  }, [initialData, isOpen]);

  // Fetch Rooms for Bundle
  useEffect(() => {
    if (isOpen && formData.productType === 'BUNDLE' && availableRooms.length === 0) {
      const fetchRooms = async () => {
        setIsFetchingRooms(true);
        try {
          const q = query(collection(db, 'assets'), where('category', '==', 'Ruangan'));
          const snap = await getDocs(q);
          setAvailableRooms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset)));
        } catch (error) {
          console.error("Gagal memuat daftar ruangan:", error);
        } finally {
          setIsFetchingRooms(false);
        }
      };
      fetchRooms();
    }
  }, [isOpen, formData.productType, availableRooms.length]);

  // Handler Array Dinamis
  const addSpecification = () => setSpecifications([...specifications, { label: '', value: '' }]);
  const removeSpecification = (index: number) => setSpecifications(specifications.filter((_, i) => i !== index));
  const updateSpecification = (index: number, field: 'label' | 'value', val: string) => {
    const newSpecs = [...specifications];
    newSpecs[index][field] = val;
    setSpecifications(newSpecs);
  };

  const addHighlight = () => setHighlights([...highlights, '']);
  const removeHighlight = (index: number) => setHighlights(highlights.filter((_, i) => i !== index));
  const updateHighlight = (index: number, val: string) => {
    const newHighlights = [...highlights];
    newHighlights[index] = val;
    setHighlights(newHighlights);
  };

  // Handler Galeri
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (existingImages.length + newImageFiles.length + filesArray.length > 5) {
        alert('Maksimal hanya boleh 5 gambar per produk.');
        return;
      }
      setNewImageFiles(prev => [...prev, ...filesArray]);
      setNewImagePreviews(prev => [...prev, ...filesArray.map(file => URL.createObjectURL(file))]);
    }
  };
  const removeExistingImage = (idx: number) => setExistingImages(prev => prev.filter((_, i) => i !== idx));
  const removeNewImage = (idx: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== idx));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // Handler Bundle
  const handleAddBundleItem = () => {
    if (!newBundleItem.name || newBundleItem.unitPrice === undefined) {
      alert("Nama dan Harga komponen harus diisi.");
      return;
    }

    const itemToAdd: BundleItem = {
      id: newBundleItem.id || `custom_${Date.now()}`,
      type: newBundleItem.type as any,
      name: newBundleItem.name,
      qty: newBundleItem.qty || 1,
      unitPrice: newBundleItem.unitPrice || 0,
      isRequired: newBundleItem.isRequired !== false
    };

    setBundleItems([...bundleItems, itemToAdd]);
    setNewBundleItem({ type: 'CUSTOM_SERVICE', qty: 1, unitPrice: 0, name: '', isRequired: true, id: '' });
  };

  const handleRemoveBundleItem = (idx: number) => setBundleItems(bundleItems.filter((_, i) => i !== idx));

  // Auto kalkulasi harga jika bundle dan isPriceCalculated = true
  useEffect(() => {
    if (formData.productType === 'BUNDLE' && formData.isPriceCalculated) {
      const calculatedTotal = bundleItems.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
      setFormData(prev => ({ ...prev, price: calculatedTotal }));
    }
  }, [bundleItems, formData.isPriceCalculated, formData.productType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Pembersihan Data Array
    const validSpecs = specifications.filter(s => s.label.trim() !== '');
    const validHighlights = highlights.filter(h => h.trim() !== '');
    const parsedTags = tagsInput.split(',').map(t => t.trim()).filter(t => t !== '');
    
    const finalDataToSubmit = {
      ...formData,
      specifications: validSpecs,
      highlights: validHighlights,
      tags: parsedTags,
      images: existingImages,
      bundleItems: formData.productType === 'BUNDLE' ? bundleItems : [],
    };
    
    await onSubmit(finalDataToSubmit, newImageFiles);
    setIsSubmitting(false);
    onClose();
  };

  const bundleSubtotal = bundleItems.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-hidden flex flex-col p-0 bg-slate-50">
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <DialogTitle>{initialData ? 'Edit Katalog Produk' : 'Tambah Katalog Baru'}</DialogTitle>
          <DialogDescription>Pengaturan lengkap untuk menyesuaikan semua jenis produk, layanan, atau paket (bundle) Anda.</DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 shrink-0 overflow-x-auto custom-scrollbar">
          <button type="button" onClick={() => setActiveTab('info')} className={`px-4 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'info' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <Info size={16}/> Info Utama
          </button>
          
          {formData.productType === 'BUNDLE' && (
            <button type="button" onClick={() => setActiveTab('bundle')} className={`px-4 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'bundle' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Package size={16}/> Komponen Bundle
            </button>
          )}

          <button type="button" onClick={() => setActiveTab('detail')} className={`px-4 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'detail' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <Tag size={16}/> Detail & Highlight
          </button>
          <button type="button" onClick={() => setActiveTab('aksi')} className={`px-4 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'aksi' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <Settings size={16}/> Sumber & Aksi
          </button>
          <button type="button" onClick={() => setActiveTab('galeri')} className={`px-4 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'galeri' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <ImageIcon size={16}/> Galeri Foto
          </button>
        </div>

        <form id="katalog-form" onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            {/* --- TAB 1: INFO UTAMA --- */}
            <div className={activeTab === 'info' ? 'block space-y-5 animate-in fade-in' : 'hidden'}>
              
              {/* TIPE PRODUK SELECTION */}
              <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-3">
                 <Label className="text-base font-black text-indigo-900">Tipe Katalog</Label>
                 <div className="flex gap-4">
                  <label className={`flex-1 border-2 rounded-xl p-4 cursor-pointer transition-all ${formData.productType === 'SINGLE' ? 'border-blue-500 bg-white shadow-sm' : 'border-indigo-200/50 hover:bg-white'}`}>
                    <input type="radio" name="productType" value="SINGLE" checked={formData.productType === 'SINGLE'} onChange={() => setFormData({...formData, productType: 'SINGLE'})} className="hidden" />
                    <div className="font-bold text-sm text-slate-800 flex items-center gap-2"><Tag size={16} className="text-blue-500"/> Standar / Tunggal</div>
                    <div className="text-xs text-slate-500 mt-1">Satu produk atau layanan spesifik.</div>
                  </label>
                  <label className={`flex-1 border-2 rounded-xl p-4 cursor-pointer transition-all ${formData.productType === 'BUNDLE' ? 'border-indigo-500 bg-white shadow-sm' : 'border-indigo-200/50 hover:bg-white'}`}>
                    <input type="radio" name="productType" value="BUNDLE" checked={formData.productType === 'BUNDLE'} onChange={() => setFormData({...formData, productType: 'BUNDLE'})} className="hidden" />
                    <div className="font-bold text-sm text-slate-800 flex items-center gap-2"><Package size={16} className="text-indigo-500"/> Paket / Bundling</div>
                    <div className="text-xs text-slate-500 mt-1">Kombinasi ruangan, layanan, dan tiket.</div>
                  </label>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="space-y-2">
                  <Label>Nama Produk / Layanan / Paket *</Label>
                  <Input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Contoh: Paket Inkubasi Startup Premium" className="h-11 bg-slate-50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kategori *</Label>
                    <Input 
                      required 
                      value={formData.category || ''} 
                      onChange={e => setFormData({...formData, category: e.target.value})} 
                      placeholder="Cth: Ruangan, Jasa, Pelatihan..." 
                      className="h-11 bg-slate-50" 
                      list="category-suggestions"
                    />
                    <datalist id="category-suggestions">
                      <option value="Ruangan" />
                      <option value="Peralatan" />
                      <option value="Layanan Teknis" />
                      <option value="Pelatihan" />
                      <option value="Paket Binaan" />
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <Label>Status Tampil *</Label>
                    <Select value={formData.isPublished ? "1" : "0"} onValueChange={val => setFormData({...formData, isPublished: val === "1"})}>
                      <SelectTrigger className="h-11 bg-slate-50"><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Aktif (Ditampilkan)</SelectItem>
                        <SelectItem value="0">Draft (Sembunyikan)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi Singkat (Muncul di Card)</Label>
                  <Input maxLength={150} value={formData.shortDescription || ''} onChange={e => setFormData({...formData, shortDescription: e.target.value})} placeholder="Satu kalimat singkat untuk memikat pengunjung..." className="h-11 bg-slate-50" />
                </div>
              </div>

              {/* HARGA (Sembunyikan jika Bundle dan Auto-Calculate) */}
              {!(formData.productType === 'BUNDLE' && formData.isPriceCalculated) && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Harga & Transaksi</h4>
                  
                  {formData.productType === 'BUNDLE' && (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-xs text-amber-700 font-medium flex items-start gap-2 mb-4">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>Karena ini adalah tipe <b>Paket</b> dan Anda mematikan kalkulasi harga otomatis, nominal yang Anda masukkan di sini akan menjadi harga final *tetap* (flat rate) untuk paket tersebut terlepas dari isi komponennya.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Harga (Rp) *</Label>
                      <Input type="number" required value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} placeholder="0" className="h-11 bg-slate-50 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label>Satuan Harga *</Label>
                      <Input required value={formData.pricingType || ''} onChange={e => setFormData({...formData, pricingType: e.target.value})} placeholder="Cth: Per Hari / Per Paket" className="h-11 bg-slate-50" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-2 w-fit">
                    <input type="checkbox" checked={formData.isNegotiable || false} onChange={e => setFormData({...formData, isNegotiable: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                    <span className="text-sm font-medium text-slate-700">Tandai sebagai "Harga Bisa Nego" / "Hubungi Kami"</span>
                  </label>
                </div>
              )}
            </div>

            {/* --- TAB BUNDLE: KOMPONEN PAKET --- */}
            {formData.productType === 'BUNDLE' && (
              <div className={activeTab === 'bundle' ? 'block space-y-5 animate-in fade-in' : 'hidden'}>
                
                {/* Form Tambah Item Bundle */}
                <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
                  <h4 className="font-bold text-indigo-900 border-b border-indigo-50 pb-2 flex items-center gap-2">
                    <Plus size={16} /> Tambah Komponen Baru
                  </h4>
                  <div className="grid grid-cols-12 gap-3 items-end">
                    
                    <div className="col-span-12 md:col-span-3 space-y-2">
                      <Label className="text-xs">Tipe Komponen</Label>
                      <Select value={newBundleItem.type} onValueChange={(val) => setNewBundleItem({...newBundleItem, type: val as any, id: '', name: '', unitPrice: 0})}>
                        <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Pilih Tipe" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ASSET_ROOM">Ruangan (Aset)</SelectItem>
                          <SelectItem value="CUSTOM_SERVICE">Layanan / Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-12 md:col-span-4 space-y-2">
                      <Label className="text-xs">Pilih / Nama Komponen</Label>
                      {newBundleItem.type === 'ASSET_ROOM' ? (
                        <div className="relative">
                          {isFetchingRooms ? (
                            <div className="h-10 w-full bg-slate-50 border border-slate-200 rounded-md flex items-center px-3 text-sm text-slate-400"><Loader2 className="w-4 h-4 animate-spin mr-2"/> Memuat ruangan...</div>
                          ) : (
                            <select 
                              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                              value={newBundleItem.id || ''}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                const room = availableRooms.find(r => r.id === selectedId);
                                if (room) {
                                  setNewBundleItem({...newBundleItem, id: room.id, name: room.name, unitPrice: room.priceValue || 0});
                                }
                              }}
                            >
                              <option value="" disabled>-- Pilih Ruangan --</option>
                              {availableRooms.map(r => (
                                <option key={r.id} value={r.id}>{r.name} (Rp {r.priceValue?.toLocaleString('id-ID')})</option>
                              ))}
                            </select>
                          )}
                        </div>
                      ) : (
                        <Input value={newBundleItem.name || ''} onChange={e => setNewBundleItem({...newBundleItem, name: e.target.value})} placeholder="Cth: Coffee Break" className="bg-slate-50" />
                      )}
                    </div>

                    <div className="col-span-6 md:col-span-2 space-y-2">
                      <Label className="text-xs">Harga Satuan</Label>
                      <Input type="number" min="0" value={newBundleItem.unitPrice || ''} onChange={e => setNewBundleItem({...newBundleItem, unitPrice: Number(e.target.value)})} placeholder="0" className="bg-slate-50" disabled={newBundleItem.type === 'ASSET_ROOM'} />
                    </div>

                    <div className="col-span-6 md:col-span-1 space-y-2">
                      <Label className="text-xs">Qty</Label>
                      <Input type="number" min="1" value={newBundleItem.qty || ''} onChange={e => setNewBundleItem({...newBundleItem, qty: Number(e.target.value)})} className="bg-slate-50 text-center" />
                    </div>

                    <div className="col-span-12 md:col-span-2">
                      <Button type="button" onClick={handleAddBundleItem} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10">
                        Tambah
                      </Button>
                    </div>

                  </div>
                </div>

                {/* List Komponen Bundle */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Daftar Komponen Paket</h4>
                  
                  {bundleItems.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-400">Belum ada komponen dalam paket ini.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bundleItems.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {item.type === 'ASSET_ROOM' && <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded uppercase">Ruangan</span>}
                              {item.type === 'CUSTOM_SERVICE' && <span className="bg-slate-200 text-slate-700 text-[9px] font-black px-2 py-0.5 rounded uppercase">Layanan Tambahan</span>}
                            </div>
                            <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                          </div>
                          <div className="flex items-center gap-6 justify-between sm:justify-end">
                            <div className="text-right">
                              <p className="text-[10px] text-slate-500 font-bold uppercase">{item.qty}x @ Rp {item.unitPrice.toLocaleString('id-ID')}</p>
                              <p className="font-black text-slate-800">Rp {(item.qty * item.unitPrice).toLocaleString('id-ID')}</p>
                            </div>
                            <button type="button" onClick={() => handleRemoveBundleItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Kalkulasi Harga Bundle */}
                <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-3">
                     <Label className="text-sm font-black text-indigo-900">Metode Penetapan Harga</Label>
                     <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={formData.isPriceCalculated} onChange={(e) => setFormData({...formData, isPriceCalculated: e.target.checked})} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                        <span className="text-sm font-bold text-indigo-800">Kalkulasi Otomatis dari Subtotal Komponen</span>
                     </div>
                     {!formData.isPriceCalculated && (
                       <p className="text-xs text-slate-600 max-w-sm leading-relaxed">Admin mengatur harga paket secara manual di Tab <strong className="font-bold">Info Utama</strong>. Cocok jika paket ini memiliki harga diskon khusus yang berbeda dari total subtotal komponennya.</p>
                     )}
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm min-w-[250px] text-right">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subtotal Komponen</p>
                    <p className="text-xl font-black text-slate-400 line-through decoration-red-500/50">Rp {bundleSubtotal.toLocaleString('id-ID')}</p>
                    <div className="border-t border-slate-100 my-2"></div>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Harga Final Paket</p>
                    <p className="text-2xl font-black text-indigo-700">Rp {(formData.price || 0).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 2: DETAIL & HIGHLIGHT --- */}
            <div className={activeTab === 'detail' ? 'block space-y-5 animate-in fade-in' : 'hidden'}>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                <Label>Deskripsi Lengkap *</Label>
                <Textarea required rows={5} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ceritakan sedetail mungkin mengenai produk atau layanan ini..." className="bg-slate-50" />
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                  <div>
                    <Label className="text-base font-bold text-slate-800">Highlight / Keunggulan</Label>
                    <p className="text-[10px] text-slate-500">Poin penting untuk menarik perhatian (Cth: Garansi 1 Tahun).</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addHighlight} className="h-8"><Plus className="h-3 w-3 mr-1" /> Tambah</Button>
                </div>
                {highlights.map((h, i) => (
                  <div key={`h-${i}`} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><CheckCircle2 size={14}/></div>
                    <Input value={h} onChange={(e) => updateHighlight(i, e.target.value)} placeholder="Tuliskan keunggulan..." className="h-10 bg-slate-50" />
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeHighlight(i)} className="shrink-0 h-10 w-10"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                  <div>
                    <Label className="text-base font-bold text-slate-800">Spesifikasi Detail</Label>
                    <p className="text-[10px] text-slate-500">Informasi teknis (Cth: Kapasitas - 50 Orang).</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addSpecification} className="h-8"><Plus className="h-3 w-3 mr-1" /> Tambah</Button>
                </div>
                {specifications.map((spec, index) => (
                  <div key={`s-${index}`} className="flex items-center gap-2">
                    <Input placeholder="Label (Cth: Dimensi)" value={spec.label} onChange={(e) => updateSpecification(index, 'label', e.target.value)} className="w-1/3 bg-slate-50" />
                    <Input placeholder="Nilai (Cth: 10x10 Meter)" value={spec.value} onChange={(e) => updateSpecification(index, 'value', e.target.value)} className="flex-1 bg-slate-50" />
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeSpecification(index)} className="shrink-0 h-10 w-10"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
                <Label>Tags / Kata Kunci (Untuk Pencarian)</Label>
                <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Cth: software, murah, diskon, makanan" className="h-11 bg-slate-50" />
                <p className="text-[10px] text-slate-500">Pisahkan dengan koma (,).</p>
              </div>
            </div>

            {/* --- TAB 3: SUMBER & AKSI --- */}
            <div className={activeTab === 'aksi' ? 'block space-y-5 animate-in fade-in' : 'hidden'}>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Sumber / Kepemilikan Produk</h4>
                <div className="flex gap-4">
                  <label className={`flex-1 border-2 rounded-xl p-4 cursor-pointer transition-colors ${formData.ownerType === 'INTERNAL' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="owner" value="INTERNAL" checked={formData.ownerType === 'INTERNAL'} onChange={() => setFormData({...formData, ownerType: 'INTERNAL', tenantName: ''})} className="hidden" />
                    <div className="font-bold text-sm text-slate-800">Milik Internal (BLUD)</div>
                    <div className="text-xs text-slate-500 mt-1">Layanan atau produk milik pengelola inkubator.</div>
                  </label>
                  <label className={`flex-1 border-2 rounded-xl p-4 cursor-pointer transition-colors ${formData.ownerType === 'TENANT' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="owner" value="TENANT" checked={formData.ownerType === 'TENANT'} onChange={() => setFormData({...formData, ownerType: 'TENANT'})} className="hidden" />
                    <div className="font-bold text-sm text-slate-800">Milik Tenant Binaan</div>
                    <div className="text-xs text-slate-500 mt-1">Produk dari perusahaan/startup yang dibina.</div>
                  </label>
                </div>
                {formData.ownerType === 'TENANT' && (
                   <div className="space-y-2 animate-in slide-in-from-top-2">
                     <Label>Nama Tenant Pemilik *</Label>
                     <Input required value={formData.tenantName || ''} onChange={e => setFormData({...formData, tenantName: e.target.value})} placeholder="Masukkan nama tenant..." className="h-11 bg-slate-50" />
                   </div>
                )}
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Tombol Aksi (Call To Action)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jenis Tindakan (Saat tombol diklik)</Label>
                    <Select value={formData.ctaType} onValueChange={val => setFormData({...formData, ctaType: val as any})}>
                      <SelectTrigger className="h-11 bg-slate-50"><SelectValue placeholder="Pilih Aksi" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INVOICE">Buat Tagihan Otomatis (Sistem)</SelectItem>
                        <SelectItem value="WHATSAPP">Chat WhatsApp</SelectItem>
                        <SelectItem value="EXTERNAL_LINK">Buka Link Website Luar</SelectItem>
                        <SelectItem value="BOOKING_FORM">Buka Form Booking (Internal)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Teks Pada Tombol</Label>
                    <Input required value={formData.ctaText || ''} onChange={e => setFormData({...formData, ctaText: e.target.value})} placeholder="Cth: Beli Sekarang" className="h-11 bg-slate-50" />
                  </div>
                </div>
                {(formData.ctaType === 'WHATSAPP' || formData.ctaType === 'EXTERNAL_LINK') && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <Label>Link Tujuan / Nomor Tujuan *</Label>
                    <Input required value={formData.ctaLink || ''} onChange={e => setFormData({...formData, ctaLink: e.target.value})} placeholder={formData.ctaType === 'WHATSAPP' ? "Cth: 628123456789 (Tanpa + atau 0)" : "Cth: https://tokopedia.com/toko"} className="h-11 bg-slate-50" />
                  </div>
                )}
              </div>
            </div>

            {/* --- TAB 4: GALERI FOTO --- */}
            <div className={activeTab === 'galeri' ? 'block space-y-5 animate-in fade-in' : 'hidden'}>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-end mb-2 border-b border-slate-100 pb-2">
                   <div>
                     <Label className="text-base font-bold text-slate-800">Galeri Gambar Produk</Label>
                     <p className="text-xs text-slate-500">Unggah hingga 5 gambar terbaik. Gambar pertama akan menjadi cover utama.</p>
                   </div>
                   <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-lg text-slate-600">
                     {existingImages.length + newImageFiles.length} / 5
                   </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {existingImages.map((url, idx) => (
                    <div key={`ex-${idx}`} className="relative aspect-square rounded-xl border border-slate-200 bg-slate-50 overflow-hidden group shadow-sm">
                      <img src={url} alt={`Existing ${idx}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button type="button" onClick={() => removeExistingImage(idx)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 hover:scale-110 transition-transform"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      {idx === 0 && <span className="absolute top-2 left-2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">COVER</span>}
                    </div>
                  ))}

                  {newImagePreviews.map((preview, idx) => (
                    <div key={`nw-${idx}`} className="relative aspect-square rounded-xl border-2 border-emerald-400 bg-emerald-50 overflow-hidden group shadow-sm">
                      <img src={preview} alt={`New ${idx}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button type="button" onClick={() => removeNewImage(idx)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 hover:scale-110 transition-transform"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">BARU</span>
                    </div>
                  ))}

                  {(existingImages.length + newImageFiles.length) < 5 && (
                    <div onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 transition-colors flex flex-col items-center justify-center text-slate-400 cursor-pointer shadow-sm">
                      <UploadCloud className="h-8 w-8 mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Tambah Foto</span>
                      <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                    </div>
                  )}
                </div>
                
                {(existingImages.length + newImageFiles.length) === 0 && (
                   <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-xl text-xs font-medium border border-amber-200">
                      <AlertCircle className="h-5 w-5 shrink-0" /> Disarankan mengunggah setidaknya 1 gambar agar produk menarik di mata pelanggan.
                   </div>
                )}
              </div>
            </div>

          </div>

          <DialogFooter className="px-6 py-4 bg-white border-t border-slate-200 sm:justify-between items-center shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
            <div className="text-xs text-slate-400 font-medium hidden sm:block">* Pastikan semua kolom ber-bintang sudah diisi.</div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1 sm:flex-none">Batal</Button>
              <Button type="submit" form="katalog-form" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : 'Simpan Katalog'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}