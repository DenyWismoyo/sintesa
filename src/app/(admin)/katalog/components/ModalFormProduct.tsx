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
      <DialogContent className="w-[96vw] sm:max-w-4xl lg:max-w-5xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0 bg-slate-50 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80">
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-slate-800">
                {initialData ? 'Edit Katalog Produk' : 'Tambah Katalog Baru'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Pengaturan lengkap produk, layanan, atau paket bundle technopark.
              </DialogDescription>
            </div>
            {formData.productType === 'BUNDLE' && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200">
                <Package size={14} /> Mode Paket / Bundling
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Tab Navigation Responsive */}
        <div className="flex border-b border-slate-200 bg-white px-3 sm:px-6 shrink-0 overflow-x-auto no-scrollbar gap-1 sm:gap-2">
          <button 
            type="button" 
            onClick={() => setActiveTab('info')} 
            className={`px-3 py-2.5 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'info' 
                ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/50 rounded-t-lg' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Info size={15}/> Info Utama
          </button>
          
          {formData.productType === 'BUNDLE' && (
            <button 
              type="button" 
              onClick={() => setActiveTab('bundle')} 
              className={`px-3 py-2.5 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'bundle' 
                  ? 'border-indigo-600 text-indigo-700 font-bold bg-indigo-50/50 rounded-t-lg' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Package size={15}/> Komponen Bundle ({bundleItems.length})
            </button>
          )}

          <button 
            type="button" 
            onClick={() => setActiveTab('detail')} 
            className={`px-3 py-2.5 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'detail' 
                ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/50 rounded-t-lg' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Tag size={15}/> Detail & Highlight
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('aksi')} 
            className={`px-3 py-2.5 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'aksi' 
                ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/50 rounded-t-lg' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Settings size={15}/> Sumber & Aksi
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('galeri')} 
            className={`px-3 py-2.5 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'galeri' 
                ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/50 rounded-t-lg' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ImageIcon size={15}/> Galeri Foto ({existingImages.length + newImageFiles.length})
          </button>
        </div>

        <form id="katalog-form" onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 no-scrollbar">
            
            {/* --- TAB 1: INFO UTAMA (GRID 2 KOLOM DI DESKTOP) --- */}
            <div className={activeTab === 'info' ? 'block animate-in fade-in duration-200' : 'hidden'}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
                
                {/* KOLOM KIRI (7/12): IDENTITAS & DESKRIPSI */}
                <div className="lg:col-span-7 space-y-4">
                  {/* TIPE PRODUK */}
                  <div className="bg-indigo-50/80 p-3 sm:p-3.5 rounded-xl border border-indigo-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Tipe Katalog</Label>
                      <span className="text-[11px] text-indigo-600 font-medium">Pilih jenis produk</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-white/90 rounded-lg border border-indigo-150">
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, productType: 'SINGLE'})} 
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                          formData.productType === 'SINGLE' 
                            ? 'bg-blue-600 text-white shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                        }`}
                      >
                        <Tag size={14} className={formData.productType === 'SINGLE' ? 'text-white' : 'text-blue-600'} />
                        <span>Standar / Tunggal</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, productType: 'BUNDLE'})} 
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all ${
                          formData.productType === 'BUNDLE' 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                        }`}
                      >
                        <Package size={14} className={formData.productType === 'BUNDLE' ? 'text-white' : 'text-indigo-600'} />
                        <span>Paket / Bundling</span>
                      </button>
                    </div>
                  </div>

                  {/* IDENTITAS PRODUK */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Nama Produk / Layanan / Paket *</Label>
                      <Input 
                        required 
                        value={formData.name || ''} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        placeholder="Contoh: Welding FCAW 1F-4F (Plat)" 
                        className="h-10 text-xs sm:text-sm bg-slate-50/70 focus:bg-white font-semibold" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Deskripsi Singkat (Muncul di Card Depan)</Label>
                      <Input 
                        maxLength={160} 
                        value={formData.shortDescription || ''} 
                        onChange={e => setFormData({...formData, shortDescription: e.target.value})} 
                        placeholder="Satu kalimat ringkas menarik calon pengunjung..." 
                        className="h-10 text-xs sm:text-sm bg-slate-50/70 focus:bg-white" 
                      />
                      <p className="text-[10px] text-slate-400 text-right">Maks. 160 karakter</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Deskripsi Lengkap / Rincian</Label>
                      <Textarea 
                        rows={4}
                        value={formData.description || ''} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        placeholder="Jelaskan secara mendalam tentang manfaat, fasilitas, silabus, atau ketentuan produk ini..." 
                        className="text-xs sm:text-sm bg-slate-50/70 focus:bg-white resize-none" 
                      />
                    </div>
                  </div>
                </div>

                {/* KOLOM KANAN (5/12): KATEGORI, STATUS & HARGA */}
                <div className="lg:col-span-5 space-y-4">
                  {/* KATEGORI & STATUS */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-800 border-b border-slate-100 pb-2">
                      Kategori & Publikasi
                    </h4>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Kategori Produk *</Label>
                      <Input 
                        required 
                        value={formData.category || ''} 
                        onChange={e => setFormData({...formData, category: e.target.value})} 
                        placeholder="Cth: Pelatihan / Ruangan / Jasa" 
                        className="h-10 text-xs sm:text-sm bg-slate-50/70 focus:bg-white" 
                        list="category-suggestions"
                      />
                      <datalist id="category-suggestions">
                        <option value="Pelatihan" />
                        <option value="Ruangan" />
                        <option value="Peralatan" />
                        <option value="Layanan Teknis" />
                        <option value="Paket Binaan" />
                        <option value="Konsultasi" />
                      </datalist>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Status Tampil *</Label>
                      <Select value={formData.isPublished ? "1" : "0"} onValueChange={val => setFormData({...formData, isPublished: val === "1"})}>
                        <SelectTrigger className="h-10 text-xs sm:text-sm bg-slate-50/70 focus:bg-white">
                          <SelectValue placeholder="Pilih Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">🟢 Aktif (Ditampilkan ke Publik)</SelectItem>
                          <SelectItem value="0">⚪ Draft (Sembunyikan Sementara)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* HARGA & TRANSAKSI */}
                  {!(formData.productType === 'BUNDLE' && formData.isPriceCalculated) && (
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 border-b border-slate-100 pb-2">
                        Harga & Transaksi
                      </h4>
                      
                      {formData.productType === 'BUNDLE' && (
                        <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100 text-[11px] text-amber-700 font-medium flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <p>Harga final flat rate untuk paket ini terlepas dari isi komponennya.</p>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Harga (Rp) *</Label>
                        <Input 
                          type="number" 
                          required 
                          value={formData.price || ''} 
                          onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                          placeholder="0" 
                          className="h-10 text-xs sm:text-sm bg-slate-50/70 focus:bg-white font-bold text-blue-700" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Satuan Harga *</Label>
                        <Input 
                          required 
                          value={formData.pricingType || ''} 
                          onChange={e => setFormData({...formData, pricingType: e.target.value})} 
                          placeholder="Cth: Per Hari / Per Paket / Per Orang" 
                          className="h-10 text-xs sm:text-sm bg-slate-50/70 focus:bg-white" 
                        />
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer pt-1 w-fit">
                        <input 
                          type="checkbox" 
                          checked={formData.isNegotiable || false} 
                          onChange={e => setFormData({...formData, isNegotiable: e.target.checked})} 
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" 
                        />
                        <span className="text-xs font-medium text-slate-700">Tandai sebagai &quot;Harga Bisa Nego&quot; / &quot;Hubungi Kami&quot;</span>
                      </label>
                    </div>
                  )}
                </div>

              </div>
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
            <div className={activeTab === 'detail' ? 'block space-y-3.5 sm:space-y-4 animate-in fade-in' : 'hidden'}>
              <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Deskripsi Lengkap *</Label>
                <Textarea required rows={4} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ceritakan sedetail mungkin mengenai produk atau layanan ini..." className="text-xs sm:text-sm bg-slate-50/70" />
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div>
                    <Label className="text-xs sm:text-sm font-bold text-slate-800">Highlight / Keunggulan</Label>
                    <p className="text-[10px] text-slate-500">Poin penting penarik perhatian pembeli.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addHighlight} className="h-7 text-xs px-2.5"><Plus className="h-3 w-3 mr-1" /> Tambah</Button>
                </div>
                {highlights.map((h, i) => (
                  <div key={`h-${i}`} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><CheckCircle2 size={12}/></div>
                    <Input value={h} onChange={(e) => updateHighlight(i, e.target.value)} placeholder="Tuliskan keunggulan..." className="h-8 sm:h-9 text-xs bg-slate-50/70" />
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeHighlight(i)} className="shrink-0 h-8 w-8"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div>
                    <Label className="text-xs sm:text-sm font-bold text-slate-800">Spesifikasi Detail</Label>
                    <p className="text-[10px] text-slate-500">Informasi teknis produk/layanan.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addSpecification} className="h-7 text-xs px-2.5"><Plus className="h-3 w-3 mr-1" /> Tambah</Button>
                </div>
                {specifications.map((spec, index) => (
                  <div key={`s-${index}`} className="flex items-center gap-2">
                    <Input placeholder="Label (Cth: Dimensi)" value={spec.label} onChange={(e) => updateSpecification(index, 'label', e.target.value)} className="w-1/3 h-8 sm:h-9 text-xs bg-slate-50/70" />
                    <Input placeholder="Nilai (Cth: 10x10 Meter)" value={spec.value} onChange={(e) => updateSpecification(index, 'value', e.target.value)} className="flex-1 h-8 sm:h-9 text-xs bg-slate-50/70" />
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeSpecification(index)} className="shrink-0 h-8 w-8"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Tags / Kata Kunci (Pencarian)</Label>
                <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Cth: software, murah, diskon, makanan" className="h-9 sm:h-10 text-xs sm:text-sm bg-slate-50/70" />
                <p className="text-[10px] text-slate-400">Pisahkan dengan koma (,).</p>
              </div>
            </div>

            {/* --- TAB 3: SUMBER & AKSI --- */}
            <div className={activeTab === 'aksi' ? 'block space-y-3.5 sm:space-y-4 animate-in fade-in' : 'hidden'}>
              <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="font-bold text-xs sm:text-sm text-slate-800 border-b border-slate-100 pb-1.5">Sumber / Kepemilikan Produk</h4>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <label className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${formData.ownerType === 'INTERNAL' ? 'border-blue-500 bg-blue-50/70' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="owner" value="INTERNAL" checked={formData.ownerType === 'INTERNAL'} onChange={() => setFormData({...formData, ownerType: 'INTERNAL', tenantName: ''})} className="hidden" />
                    <div className="font-bold text-xs sm:text-sm text-slate-800">Internal BLUD</div>
                    <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Produk pengelola technopark.</div>
                  </label>
                  <label className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${formData.ownerType === 'TENANT' ? 'border-amber-500 bg-amber-50/70' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="owner" value="TENANT" checked={formData.ownerType === 'TENANT'} onChange={() => setFormData({...formData, ownerType: 'TENANT'})} className="hidden" />
                    <div className="font-bold text-xs sm:text-sm text-slate-800">Tenant Binaan</div>
                    <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Produk startup/mitra.</div>
                  </label>
                </div>
                {formData.ownerType === 'TENANT' && (
                   <div className="space-y-1.5 animate-in slide-in-from-top-2 pt-1">
                     <Label className="text-xs font-semibold text-slate-700">Nama Tenant Pemilik *</Label>
                     <Input required value={formData.tenantName || ''} onChange={e => setFormData({...formData, tenantName: e.target.value})} placeholder="Masukkan nama tenant..." className="h-9 sm:h-10 text-xs sm:text-sm bg-slate-50/70" />
                   </div>
                )}
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="font-bold text-xs sm:text-sm text-slate-800 border-b border-slate-100 pb-1.5">Tombol Aksi (Call To Action)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Jenis Tindakan</Label>
                    <Select value={formData.ctaType} onValueChange={val => setFormData({...formData, ctaType: val as any})}>
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm bg-slate-50/70"><SelectValue placeholder="Pilih Aksi" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INVOICE">Buat Tagihan Otomatis (Sistem)</SelectItem>
                        <SelectItem value="WHATSAPP">Chat WhatsApp</SelectItem>
                        <SelectItem value="EXTERNAL_LINK">Buka Link Luar</SelectItem>
                        <SelectItem value="BOOKING_FORM">Buka Form Booking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Teks Pada Tombol</Label>
                    <Input required value={formData.ctaText || ''} onChange={e => setFormData({...formData, ctaText: e.target.value})} placeholder="Cth: Hubungi Kami" className="h-9 sm:h-10 text-xs sm:text-sm bg-slate-50/70" />
                  </div>
                </div>
                {(formData.ctaType === 'WHATSAPP' || formData.ctaType === 'EXTERNAL_LINK') && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 pt-1">
                    <Label className="text-xs font-semibold text-slate-700">Link Tujuan / No. WA *</Label>
                    <Input required value={formData.ctaLink || ''} onChange={e => setFormData({...formData, ctaLink: e.target.value})} placeholder={formData.ctaType === 'WHATSAPP' ? "Cth: 628123456789 (Tanpa +/0)" : "Cth: https://example.com"} className="h-9 sm:h-10 text-xs sm:text-sm bg-slate-50/70" />
                  </div>
                )}
              </div>
            </div>

            {/* --- TAB 4: GALERI FOTO (EASY DELETE DI PONSEL & DESKTOP) --- */}
            <div className={activeTab === 'galeri' ? 'block space-y-4 animate-in fade-in duration-200' : 'hidden'}>
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                   <div>
                     <Label className="text-sm font-black text-slate-800">Galeri Foto Produk</Label>
                     <p className="text-xs text-slate-500 mt-0.5">
                       Unggah hingga 5 foto landscape (16:9 disarankan). Foto pertama otomatis menjadi cover utama.
                     </p>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                       (existingImages.length + newImageFiles.length) > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600'
                     }`}>
                       {existingImages.length + newImageFiles.length} dari 5 Foto
                     </span>
                     {(existingImages.length + newImageFiles.length) < 5 && (
                       <Button 
                         type="button" 
                         size="sm" 
                         onClick={() => fileInputRef.current?.click()} 
                         className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5"
                       >
                         <UploadCloud size={14} />
                         <span>Tambah Foto</span>
                       </Button>
                     )}
                   </div>
                </div>
                
                {/* GRID FOTO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {/* FOTO EKSISTING */}
                  {existingImages.map((url, idx) => (
                    <div 
                      key={`ex-${idx}`} 
                      className={`relative aspect-video rounded-xl border-2 overflow-hidden shadow-xs bg-slate-100 transition-all ${
                        idx === 0 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'
                      }`}
                    >
                      <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      
                      {/* BADGE COVER */}
                      {idx === 0 && (
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md tracking-wider">
                          COVER UTAMA
                        </span>
                      )}

                      {/* TOMBOL HAPUS PERMANEN (MUDAH DI SENTUH DI PONSEL & DESKTOP) */}
                      <button 
                        type="button" 
                        onClick={() => removeExistingImage(idx)} 
                        title="Hapus foto ini"
                        className="absolute top-2 right-2 z-20 w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 active:scale-90 text-white shadow-lg flex items-center justify-center transition-all cursor-pointer border border-white/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      {/* BAR AKSI BAWAH */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-white/90">Foto #{idx + 1}</span>
                        <button 
                          type="button" 
                          onClick={() => removeExistingImage(idx)}
                          className="text-[11px] font-bold text-red-300 hover:text-red-100 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* FOTO BARU YANG DIPILIH */}
                  {newImagePreviews.map((preview, idx) => (
                    <div 
                      key={`nw-${idx}`} 
                      className="relative aspect-video rounded-xl border-2 border-emerald-500 bg-emerald-50 overflow-hidden shadow-xs ring-2 ring-emerald-200 transition-all"
                    >
                      <img src={preview} alt={`Foto Baru ${idx + 1}`} className="w-full h-full object-cover" />
                      
                      {/* BADGE BARU */}
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md tracking-wider">
                        FOTO BARU
                      </span>

                      {/* TOMBOL HAPUS PERMANEN */}
                      <button 
                        type="button" 
                        onClick={() => removeNewImage(idx)} 
                        title="Batal / Hapus foto baru ini"
                        className="absolute top-2 right-2 z-20 w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 active:scale-90 text-white shadow-lg flex items-center justify-center transition-all cursor-pointer border border-white/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      {/* BAR AKSI BAWAH */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-white/90">Menunggu Disimpan</span>
                        <button 
                          type="button" 
                          onClick={() => removeNewImage(idx)}
                          className="text-[11px] font-bold text-red-300 hover:text-red-100 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* CARD TAMBAH FOTO */}
                  {(existingImages.length + newImageFiles.length) < 5 && (
                    <div 
                      onClick={() => fileInputRef.current?.click()} 
                      className="aspect-video rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/80 hover:bg-blue-50/60 hover:border-blue-400 transition-all flex flex-col items-center justify-center text-slate-500 cursor-pointer shadow-2xs group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white shadow-2xs flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform mb-1.5 border border-slate-200">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                        Pilih Gambar
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, atau WEBP</span>
                      <input 
                        ref={fileInputRef} 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className="hidden" 
                      />
                    </div>
                  )}
                </div>
                
                {(existingImages.length + newImageFiles.length) === 0 && (
                   <div className="flex items-center gap-2.5 text-amber-800 bg-amber-50 p-3 rounded-xl text-xs font-medium border border-amber-200">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" /> 
                      Unggah minimal 1 foto agar katalog memiliki gambar sampul dan menarik perhatian pengunjung.
                   </div>
                )}
              </div>
            </div>

          </div>

          <DialogFooter className="px-4 py-3 sm:px-6 sm:py-3.5 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between shadow-xs">
            <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
              * Pastikan semua kolom penting terisi sebelum menyimpan.
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1 sm:flex-none h-10 text-xs sm:text-sm font-semibold">
                Batal
              </Button>
              <Button type="submit" form="katalog-form" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex-1 sm:flex-none h-10 text-xs sm:text-sm">
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : 'Simpan Katalog'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}