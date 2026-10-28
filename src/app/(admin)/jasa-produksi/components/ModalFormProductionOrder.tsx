// Lokasi file: src/app/(admin)/jasa-produksi/components/ModalFormProductionOrder.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  ProductionOrder, 
  ProductionItem, 
  ProductionCategory, 
  ClientType, 
  PRODUCTION_CATEGORY_LABELS,
  ProductionCategoryEnum,
  ClientTypeEnum
} from '@/types/production.types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2, FileUp, Sparkles, AlertCircle, Wrench, Calendar, Building2, User } from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@/utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ProductionOrder, 'id'>) => Promise<boolean>;
  initialData?: ProductionOrder | null;
  onUploadFile?: (file: File) => Promise<string>;
}

export default function ModalFormProductionOrder({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  onUploadFile
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // States Informasi Pemesan
  const [clientName, setClientName] = useState('');
  const [clientType, setClientType] = useState<ClientType>('Industri');
  const [clientPic, setClientPic] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  // States Parameter Pekerjaan
  const [projectTitle, setProjectTitle] = useState('');
  const [category, setCategory] = useState<ProductionCategory>('CNC_MACHINING');
  const [workshopLocation, setWorkshopLocation] = useState('Workshop CNC & Fabrikasi Gedung C STP');
  const [assignedTechnician, setAssignedTechnician] = useState('Tim Manufaktur STP');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');
  const [estimatedDurationDays, setEstimatedDurationDays] = useState(7);
  const [notes, setNotes] = useState('');

  // Dynamic Item List
  const [items, setItems] = useState<ProductionItem[]>([
    {
      id: Date.now().toString(),
      partName: '',
      material: 'Baja Stainless SUS 304',
      dimensions: '-',
      quantity: 1,
      unit: 'Pcs',
      unitPrice: 0,
      totalPrice: 0,
      notes: ''
    }
  ]);

  // Aspek Uang Muka (DP)
  const [dpRequired, setDpRequired] = useState(true);
  const [dpPercentage, setDpPercentage] = useState(30);

  // Berkas Blueprint / Desain
  const [blueprintFiles, setBlueprintFiles] = useState<any[]>([]);

  useEffect(() => {
    if (initialData) {
      setClientName(initialData.clientName || '');
      setClientType(initialData.clientType || 'Industri');
      setClientPic(initialData.clientPic || '');
      setClientPhone(initialData.clientPhone || '');
      setClientEmail(initialData.clientEmail || '');
      setClientAddress(initialData.clientAddress || '');

      setProjectTitle(initialData.projectTitle || '');
      setCategory(initialData.category || 'CNC_MACHINING');
      setWorkshopLocation(initialData.workshopLocation || 'Workshop CNC & Fabrikasi Gedung C STP');
      setAssignedTechnician(initialData.assignedTechnician || 'Tim Manufaktur STP');
      setTargetDeliveryDate(initialData.targetDeliveryDate || '');
      setEstimatedDurationDays(initialData.estimatedDurationDays || 7);
      setNotes(initialData.notes || '');

      if (initialData.items && initialData.items.length > 0) {
        setItems(initialData.items);
      }
      setDpRequired(initialData.dpRequired ?? true);
      setDpPercentage(initialData.dpPercentage ?? 30);
      setBlueprintFiles(initialData.blueprintFiles || []);
    } else {
      // Reset Default Form Baru
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 10);
      setTargetDeliveryDate(defaultDate.toISOString().split('T')[0]);
      setClientName('');
      setClientType('Industri');
      setClientPic('');
      setClientPhone('');
      setClientEmail('');
      setClientAddress('');
      setProjectTitle('');
      setCategory('CNC_MACHINING');
      setItems([
        {
          id: Date.now().toString(),
          partName: '',
          material: 'Aluminium 6061 T6',
          dimensions: '-',
          quantity: 1,
          unit: 'Pcs',
          unitPrice: 0,
          totalPrice: 0,
          notes: ''
        }
      ]);
      setBlueprintFiles([]);
      setDpRequired(true);
      setDpPercentage(30);
      setNotes('');
    }
  }, [initialData, isOpen]);

  // Kalkulasi Total Biaya & DP
  const totalCost = items.reduce((sum, it) => sum + (it.totalPrice || it.quantity * it.unitPrice || 0), 0);
  const dpAmount = dpRequired ? Math.round((totalCost * dpPercentage) / 100) : 0;
  const sisaPelunasan = Math.max(0, totalCost - dpAmount);

  // Item Handlers
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString().slice(2, 6),
        partName: '',
        material: 'Baja ST37',
        dimensions: '-',
        quantity: 1,
        unit: 'Pcs',
        unitPrice: 0,
        totalPrice: 0,
        notes: ''
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error('Pesanan minimal harus memiliki 1 rincian part.');
      return;
    }
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleItemChange = (id: string, field: keyof ProductionItem, value: any) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id === id) {
          const updated = { ...it, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            const qty = field === 'quantity' ? Number(value) : it.quantity;
            const price = field === 'unitPrice' ? Number(value) : it.unitPrice;
            updated.totalPrice = Math.max(0, qty) * Math.max(0, price);
          }
          return updated;
        }
        return it;
      })
    );
  };

  // Upload Blueprint Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadFile) return;

    setIsUploading(true);
    const toastId = toast.loading(`Mengunggah gambar teknik ${file.name}...`);
    try {
      const url = await onUploadFile(file);
      const newFileObj = {
        id: Date.now().toString(),
        name: file.name,
        url,
        uploadedAt: Date.now(),
        size: file.size
      };
      setBlueprintFiles(prev => [...prev, newFileObj]);
      toast.success('Berkas berhasil dilampirkan!', { id: toastId });
    } catch (err: any) {
      toast.error('Gagal mengunggah gambar teknik', { id: toastId, description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (id: string) => {
    setBlueprintFiles(prev => prev.filter(f => f.id !== id));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error('Nama klien / pemesan wajib diisi.');
      return;
    }
    if (!projectTitle.trim()) {
      toast.error('Judul proyek/pekerjaan wajib diisi.');
      return;
    }
    if (items.some(it => !it.partName.trim())) {
      toast.error('Seluruh nama part/komponen pada tabel rincian wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<ProductionOrder, 'id'> = {
        orderNumber: initialData?.orderNumber || '', // Diserahkan ke service jika baru
        clientName: clientName.trim(),
        clientType,
        clientPic: clientPic.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        clientAddress: clientAddress.trim(),

        projectTitle: projectTitle.trim(),
        category,
        items,
        blueprintFiles,

        estimatedDurationDays: Number(estimatedDurationDays) || 7,
        targetDeliveryDate: targetDeliveryDate || new Date().toISOString().split('T')[0],
        actualDeliveryDate: initialData?.actualDeliveryDate || null,

        status: initialData?.status || 'DRAFT',
        productionProgress: initialData?.productionProgress || 0,
        assignedTechnician: assignedTechnician.trim() || 'Tim Manufaktur STP',
        workshopLocation: workshopLocation.trim() || 'Workshop CNC STP',
        workNotes: initialData?.workNotes || [],

        totalCost,
        dpRequired,
        dpPercentage: Number(dpPercentage) || 30,
        dpAmount,
        dpInvoiceId: initialData?.dpInvoiceId || null,
        finalInvoiceId: initialData?.finalInvoiceId || null,
        paymentStatus: initialData?.paymentStatus || 'UNPAID',

        deliveryOrder: initialData?.deliveryOrder || null,
        notes: notes.trim()
      };

      const success = await onSubmit(payload);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      toast.error('Gagal menyimpan pesanan produksi', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] sm:max-w-4xl max-h-[92vh] sm:max-h-[88vh] my-auto rounded-2xl sm:rounded-3xl p-0 border border-slate-100 shadow-2xl overflow-hidden bg-white flex flex-col focus:outline-none">
        
        {/* HEADER MODAL */}
        <DialogHeader className="px-5 py-4 border-b border-slate-100 bg-white/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                {initialData ? 'Perbarui Pesanan Jasa Produksi' : 'Penerbitan Pesanan Jasa Produksi Baru (SPK)'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Input spesifikasi manufaktur, estimasi biaya part, dan ketentuan pengerjaan bengkel STP.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* FORM BODY SCROLLABLE */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
            
            {/* 1. KARTU INFORMASI PEMESAN */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-blue-600" /> Data Pemesan / Mitra Industri
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Nama Perusahaan / Instansi / Pemesan *</Label>
                  <Input 
                    required 
                    placeholder="e.g. PT Industri Presisi Nusantara" 
                    value={clientName} 
                    onChange={e => setClientName(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white border-slate-200" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Kategori Klien</Label>
                  <Select value={clientType} onValueChange={(val: ClientType) => setClientType(val)}>
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-white border-slate-200">
                      <SelectValue placeholder="Pilih Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Industri">Industri / Korporasi</SelectItem>
                      <SelectItem value="Instansi">Instansi Pemerintah / BUMN</SelectItem>
                      <SelectItem value="UMKM">Pelaku Usaha (UMKM)</SelectItem>
                      <SelectItem value="Perorangan">Perorangan / Akademisi</SelectItem>
                      <SelectItem value="Internal_STP">Internal Solo Technopark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Nama PIC Pemesan</Label>
                  <Input 
                    placeholder="e.g. Ir. Bambang" 
                    value={clientPic} 
                    onChange={e => setClientPic(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white border-slate-200" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">No. Telepon / WhatsApp</Label>
                  <Input 
                    placeholder="08xxxxxxxxxx" 
                    value={clientPhone} 
                    onChange={e => setClientPhone(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white border-slate-200" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Email Pemesan</Label>
                  <Input 
                    type="email" 
                    placeholder="pic@perusahaan.com" 
                    value={clientEmail} 
                    onChange={e => setClientEmail(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white border-slate-200" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Alamat Pengiriman Barang</Label>
                <Input 
                  placeholder="e.g. Kawasan Industri Palur Blok C-10, Karanganyar" 
                  value={clientAddress} 
                  onChange={e => setClientAddress(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white border-slate-200" 
                />
              </div>
            </div>

            {/* 2. PARAMETER PEKERJAAN & LOKASI MESIN */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Wrench className="w-3.5 h-3.5 text-blue-600" /> Parameter Proyek & Workshop
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Judul Proyek / Nama Pekerjaan *</Label>
                  <Input 
                    required 
                    placeholder="e.g. Pembuatan Shaft Rotor & Flange Machining" 
                    value={projectTitle} 
                    onChange={e => setProjectTitle(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white border-slate-200 font-bold text-slate-800" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Kategori Mesin / Layanan</Label>
                  <Select value={category} onValueChange={(val: ProductionCategory) => setCategory(val)}>
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-white border-slate-200">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CNC_MACHINING">CNC & Presisi Machining</SelectItem>
                      <SelectItem value="FABRIKASI_LAS">Fabrikasi & Pengelasan Logam</SelectItem>
                      <SelectItem value="3D_PRINTING">3D Printing & Additive Mfg</SelectItem>
                      <SelectItem value="ELECTRONICS_IOT">Elektronika & Perakitan IoT</SelectItem>
                      <SelectItem value="CAD_DESIGN">Desain CAD / Modeling 3D</SelectItem>
                      <SelectItem value="LAINNYA">Layanan Manufaktur Khusus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Lokasi Workshop STP</Label>
                  <Input 
                    value={workshopLocation} 
                    onChange={e => setWorkshopLocation(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white border-slate-200" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Teknisi PIC / Kepala Bengkel</Label>
                  <Input 
                    value={assignedTechnician} 
                    onChange={e => setAssignedTechnician(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white border-slate-200" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Target Tanggal Selesai</Label>
                  <Input 
                    type="date"
                    required
                    value={targetDeliveryDate} 
                    onChange={e => setTargetDeliveryDate(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-white border-slate-200" 
                  />
                </div>
              </div>
            </div>

            {/* 3. TABEL DINAMIS RINCIAN PART PRODUKSI */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Rincian Komponen / Part yang Dikerjakan
                </span>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={handleAddItem}
                  className="h-8 text-xs font-bold text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-100 rounded-lg gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Baris Part
                </Button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Nama Part / Komponen *</th>
                        <th className="py-2.5 px-3 min-w-[130px]">Material</th>
                        <th className="py-2.5 px-3 min-w-[110px]">Dimensi</th>
                        <th className="py-2.5 px-2 w-16 text-center">Qty</th>
                        <th className="py-2.5 px-2 w-20">Satuan</th>
                        <th className="py-2.5 px-3 min-w-[120px] text-right">Tarif Satuan (Rp)</th>
                        <th className="py-2.5 px-3 min-w-[120px] text-right">Subtotal (Rp)</th>
                        <th className="py-2.5 px-2 w-10 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <Input 
                              required 
                              placeholder="e.g. Shaft Utama Rotor" 
                              value={item.partName} 
                              onChange={e => handleItemChange(item.id, 'partName', e.target.value)}
                              className="h-8 text-xs rounded-lg bg-white border-slate-200 font-semibold" 
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input 
                              placeholder="e.g. SUS 304 / Al 6061" 
                              value={item.material} 
                              onChange={e => handleItemChange(item.id, 'material', e.target.value)}
                              className="h-8 text-xs rounded-lg bg-white border-slate-200" 
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input 
                              placeholder="Dia 40x350mm" 
                              value={item.dimensions} 
                              onChange={e => handleItemChange(item.id, 'dimensions', e.target.value)}
                              className="h-8 text-xs rounded-lg bg-white border-slate-200" 
                            />
                          </td>
                          <td className="py-2 px-2">
                            <Input 
                              type="number" 
                              min="1" 
                              required 
                              value={item.quantity} 
                              onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                              className="h-8 text-xs text-center rounded-lg bg-white border-slate-200 font-bold" 
                            />
                          </td>
                          <td className="py-2 px-2">
                            <Input 
                              value={item.unit} 
                              onChange={e => handleItemChange(item.id, 'unit', e.target.value)}
                              className="h-8 text-xs text-center rounded-lg bg-white border-slate-200" 
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input 
                              type="number" 
                              min="0" 
                              value={item.unitPrice || ''} 
                              onChange={e => handleItemChange(item.id, 'unitPrice', e.target.value)}
                              placeholder="0"
                              className="h-8 text-xs text-right rounded-lg bg-white border-slate-200 font-bold text-slate-800" 
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-black text-blue-700">
                            {formatRupiah(item.totalPrice || item.quantity * item.unitPrice || 0)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button 
                              type="button" 
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                              title="Hapus baris"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 4. KALKULASI FINANSIAL & PENGATURAN DP */}
            <div className="bg-gradient-to-br from-blue-50/60 to-slate-50 p-4 rounded-2xl border border-blue-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-blue-900 block">Total Estimasi Biaya</span>
                <p className="text-xl font-black text-blue-800">{formatRupiah(totalCost)}</p>
                <p className="text-[11px] text-slate-500">Akumulasi seluruh biaya material & jasa pengerjaan mesin.</p>
              </div>

              <div className="space-y-2 sm:border-x sm:border-blue-100 sm:px-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-blue-900 cursor-pointer flex items-center gap-1.5">
                    <input 
                      type="checkbox" 
                      checked={dpRequired} 
                      onChange={e => setDpRequired(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                    />
                    Wajib Uang Muka (DP)
                  </Label>
                  {dpRequired && (
                    <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                      {dpPercentage}%
                    </span>
                  )}
                </div>

                {dpRequired ? (
                  <>
                    <input 
                      type="range" 
                      min="10" 
                      max="70" 
                      step="5" 
                      value={dpPercentage} 
                      onChange={e => setDpPercentage(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer h-1.5 bg-blue-200 rounded-lg" 
                    />
                    <p className="text-sm font-black text-amber-700">Nominal DP: {formatRupiah(dpAmount)}</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 italic mt-2">Pengerjaan tanpa DP (Pelunasan 100% di akhir).</p>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Sisa Pelunasan Sebelum Kirim</span>
                <p className="text-lg font-black text-slate-800">{formatRupiah(sisaPelunasan)}</p>
                <p className="text-[11px] text-slate-500">Dilunasi sebelum barang diserahkan ke kurir/klien.</p>
              </div>
            </div>

            {/* 5. LAMPIRAN BERKAS DESAIN CAD / BLUEPRINT */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <FileUp className="w-3.5 h-3.5 text-blue-600" /> Lampiran Gambar Teknik / CAD (Opsional)
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 shadow-2xs">
                  <FileUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isUploading ? 'Mengunggah...' : 'Pilih Berkas CAD / Gambar (.pdf, .dwg, .step, .png)'}</span>
                  <input type="file" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
                </label>
              </div>

              {blueprintFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {blueprintFiles.map((file: any) => (
                    <div key={file.id} className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-xs flex items-center gap-2">
                      <span className="font-medium text-slate-700 truncate max-w-[200px]">{file.name}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveFile(file.id)} 
                        className="text-slate-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. CATATAN KHUSUS BENGKEL */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Catatan Khusus Pengerjaan / Instruksi Toleransi</Label>
              <Textarea 
                placeholder="e.g. Toleransi presisi H7, permukaan bebas burr, dilakukan uji kekerasan Rockwell..." 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                className="text-xs rounded-xl bg-white border-slate-200 resize-none h-16" 
              />
            </div>

          </div>

          {/* FOOTER MODAL */}
          <DialogFooter className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-row justify-end items-center gap-2 shrink-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isUploading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-5 shadow-xs shadow-blue-200 gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{initialData ? 'Perbarui Pesanan' : 'Simpan & Terbitkan SPK'}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  );
}
