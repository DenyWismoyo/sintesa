import React, { useState, useMemo } from 'react';
import { useAssets } from '@/hooks/useAssets';
import { Asset } from '@/types';
import { 
  Users, LayoutTemplate, MonitorSpeaker, Edit, Loader2, 
  Image as ImageIcon, Plus, Trash2, CheckCircle2, DollarSign, Info, ArrowDownUp
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const parseFacilities = (facilitiesStr?: string) => {
  if (!facilitiesStr) return [];
  try {
    const parsed = JSON.parse(facilitiesStr);
    if (Array.isArray(parsed)) return parsed;
    return [{ label: 'Fasilitas Dasar', value: facilitiesStr }];
  } catch {
    return [{ label: 'Fasilitas Dasar', value: facilitiesStr }];
  }
};

type SortOption = 'price_desc' | 'price_asc' | 'name_asc';

export default function TabManajemenRuangan() {
  // PERBAIKAN: Gunakan publicRooms dari useAssets yang sudah dikalibrasi dengan Master Cache
  const { publicRooms: rooms, loadingRooms: loading, saveAssetWithImage } = useAssets();
  
  const [selectedRoom, setSelectedRoom] = useState<Asset | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [sortBy, setSortBy] = useState<SortOption>('price_desc');

  // Form State
  const [capacity, setCapacity] = useState<number>(0);
  const [layout, setLayout] = useState('');
  const [specifications, setSpecifications] = useState<{label: string, value: string}[]>([]);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Commercial State
  const [isRentable, setIsRentable] = useState<boolean>(false);
  const [priceValue, setPriceValue] = useState<number>(0);
  const [pricingType, setPricingType] = useState<string>('Hari');

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const priceA = a.priceValue || 0;
      const priceB = b.priceValue || 0;
      
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'price_asc') return priceA - priceB;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [rooms, sortBy]);

  const openEditModal = (room: Asset) => {
    setSelectedRoom(room);
    setCapacity(room.capacity || 0);
    setLayout(room.layout || '');
    setSpecifications(parseFacilities(room.facilities));
    setIsRentable(room.isRentable || false);
    setPriceValue(room.priceValue || 0);
    setPricingType(room.pricingType || 'Hari');
    
    setImageFile(null);
    setImagePreview(room.imageUrl || null);
    
    setIsEditModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran gambar terlalu besar (Maksimal 2MB).");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addSpecification = () => setSpecifications([...specifications, { label: '', value: '' }]);
  const removeSpecification = (index: number) => setSpecifications(specifications.filter((_, i) => i !== index));
  
  const updateSpecification = (index: number, field: 'label' | 'value', val: string) => {
    const newSpecs = [...specifications];
    newSpecs[index][field] = val;
    setSpecifications(newSpecs);
  };

  const handleSaveRoomSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !selectedRoom.id) return;
    
    setIsSaving(true);
    const validSpecs = specifications.filter(s => s.label.trim() !== '');
    const facilitiesString = validSpecs.length > 0 ? JSON.stringify(validSpecs) : '';

    const assetData: Partial<Asset> = {
      id: selectedRoom.id,
      capacity: Number(capacity) || 0,
      layout: layout || '',
      facilities: facilitiesString,
      isRentable,
      priceValue: isRentable ? Number(priceValue) : 0,
      pricingType: isRentable ? pricingType : '', 
    };

    if (selectedRoom.imageUrl) {
      assetData.imageUrl = selectedRoom.imageUrl;
    }

    const res = await saveAssetWithImage(assetData, imageFile);
    
    setIsSaving(false);

    if (res.success) {
      toast.success("Spesifikasi & Foto Ruangan diperbarui!");
      setIsEditModalOpen(false);
    } else {
      toast.error("Gagal memperbarui data.");
    }
  };

  if (loading) return (
    <div className="p-20 text-center text-slate-500 flex flex-col items-center bg-white rounded-3xl border border-slate-200">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
      <span className="font-semibold text-lg">Memuat Daftar Ruangan...</span>
    </div>
  );

  return (
    <div className="animate-in fade-in space-y-6">
      
      {/* Header & Sorting Feature */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="bg-slate-50 text-slate-600 px-4 py-3 rounded-xl text-sm flex items-center gap-3 border border-slate-200 flex-1 w-full shadow-sm">
          <Info className="h-5 w-5 shrink-0 text-blue-500" />
          <p>Aktifkan <b>komersialisasi ruangan</b> di sini agar ruangan dapat disewa oleh publik melalui web katalog.</p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <div className="relative w-full md:w-56">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <ArrowDownUp className="h-4 w-4 text-slate-400" />
            </div>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full h-11 pl-9 pr-8 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl shadow-sm appearance-none outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="price_desc">Harga Tertinggi</option>
              <option value="price_asc">Harga Terendah</option>
              <option value="name_asc">Nama (A-Z)</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedRooms.map((room) => {
          const specs = parseFacilities(room.facilities);

          return (
            <div key={room.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 group">
              <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                {room.imageUrl ? (
                  <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <ImageIcon className="text-slate-300 h-10 w-10" />
                )}
                <div className="absolute top-4 left-4">
                  <div className="bg-white/95 backdrop-blur-sm text-slate-700 text-[10px] px-2.5 py-1 rounded-md font-bold shadow-sm uppercase tracking-wider border border-white/50">
                    {room.status}
                  </div>
                </div>
                {room.isRentable && (
                  <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-white/50 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> 
                    <span className="font-black text-slate-800 text-sm">Rp {room.priceValue?.toLocaleString('id-ID')}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">/ {room.pricingType || 'Sewa'}</span>
                  </div>
                )}
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h3 className="text-lg font-black text-slate-800 leading-tight line-clamp-2">{room.name}</h3>
                </div>
                <p className="text-[11px] font-bold text-blue-600 bg-blue-50 w-fit px-2.5 py-1 rounded-md mb-5 truncate max-w-full border border-blue-100">{room.location}</p>
                
                <div className="space-y-3 mb-6 flex-1 text-sm text-slate-600">
                  <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-2 rounded-xl">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-xs">Kapasitas: <span className="font-bold text-slate-800">{room.capacity ? `${room.capacity} Orang` : '-'}</span></span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-2 rounded-xl">
                    <LayoutTemplate className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-xs">Layout: <span className="font-bold text-slate-800">{room.layout || '-'}</span></span>
                  </div>
                  
                  {specs.length > 0 ? (
                    <div className="pt-4 mt-2 border-t border-slate-100 space-y-2">
                      {specs.slice(0, 3).map((s, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-slate-500 font-medium">{s.label}:</span>
                          <span className="font-bold text-slate-800">{s.value}</span>
                        </div>
                      ))}
                      {specs.length > 3 && (
                        <p className="text-[10px] text-slate-400 font-medium italic pl-6">+{specs.length - 3} spesifikasi lainnya...</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 pt-4 mt-2 border-t border-slate-100">
                      <MonitorSpeaker className="w-4 h-4 text-slate-300 shrink-0" />
                      <span className="text-xs text-slate-400 italic font-medium">Spesifikasi belum diatur</span>
                    </div>
                  )}
                </div>
                
                <Button onClick={() => openEditModal(room)} variant="outline" className="w-full border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 mt-auto shadow-sm h-11 font-bold">
                  <Edit className="w-4 h-4 mr-2" /> Atur Spesifikasi
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[650px] flex flex-col max-h-[90vh] p-0 overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-2xl">
          <DialogHeader className="px-8 py-6 border-b border-slate-100 bg-white/50 backdrop-blur-md">
            <DialogTitle className="text-xl font-black text-slate-800">Atur Spesifikasi & Harga Sewa</DialogTitle>
            <DialogDescription className="text-slate-500 mt-1">Tambahkan detail fasilitas, upload foto, dan aktifkan komersialisasi untuk ruang ini.</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveRoomSpecs} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/50">
              <div className="space-y-2.5">
                <Label className="text-xs font-bold text-slate-700">Nama Ruangan (Hanya Baca)</Label>
                <Input disabled value={selectedRoom?.name || ''} className="bg-slate-100 font-bold border-slate-200 text-slate-600 h-11 rounded-xl" />
              </div>

              {/* AREA UPLOAD GAMBAR */}
              <div className="flex flex-col md:flex-row items-center gap-6 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="h-24 w-36 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shrink-0 flex items-center justify-center relative group">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview Ruangan" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="text-slate-300 h-8 w-8" />
                  )}
                </div>
                <div className="flex-1 w-full space-y-2">
                  <Label className="text-sm font-bold text-slate-800">Foto Utama Ruangan</Label>
                  <div className="relative">
                    <Input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg" 
                      onChange={handleImageChange} 
                      className="text-xs file:bg-blue-50 file:text-blue-700 file:border-0 file:rounded-md file:px-3 file:py-1.5 file:mr-3 hover:file:bg-blue-100 cursor-pointer h-10 pt-1.5 rounded-lg border-slate-200" 
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Format: JPG/PNG. Maks 2MB.</p>
                </div>
              </div>

              {/* PENGATURAN HARGA / KOMERSIAL */}
              <div className="bg-white border border-blue-100 p-5 rounded-2xl space-y-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-black text-slate-800">Komersialisasi Ruangan</Label>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">Aktifkan agar ruangan ini dapat disewakan.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isRentable} onChange={(e) => setIsRentable(e.target.checked)} className="sr-only peer" />
                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {isRentable && (
                  <div className="grid grid-cols-12 gap-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                    <div className="col-span-12 md:col-span-7 space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Tarif Sewa (Rp)</Label>
                      <Input type="number" min="0" value={priceValue || ''} onChange={(e) => setPriceValue(Number(e.target.value))} placeholder="Contoh: 1500000" className="font-bold text-slate-800 h-11 rounded-xl bg-slate-50 focus:bg-white" required={isRentable} />
                    </div>
                    <div className="col-span-12 md:col-span-5 space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Tipe / Satuan</Label>
                      <select value={pricingType} onChange={(e) => setPricingType(e.target.value)} className="w-full h-11 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white text-slate-800">
                        <option value="Jam">Per Jam</option>
                        <option value="Hari">Per Hari</option>
                        <option value="Bulan">Per Bulan</option>
                        <option value="Acara">Per Acara</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Kapasitas Maksimal (Orang)</Label>
                  <Input type="number" min="0" value={capacity || ''} onChange={(e) => setCapacity(Number(e.target.value))} placeholder="Contoh: 100" className="h-11 rounded-xl bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Layout Tersedia</Label>
                  <Input value={layout} onChange={(e) => setLayout(e.target.value)} placeholder="Cth: U-Shape, Classroom" className="h-11 rounded-xl bg-white" />
                </div>
              </div>

              {/* AREA SPESIFIKASI DINAMIS */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Label className="text-sm font-black text-slate-800">Fasilitas & Detail Alat</Label>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Tambahkan detail proyektor, AC, dll.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addSpecification} className="border-dashed h-9 text-blue-600 border-blue-200 hover:bg-blue-50 rounded-lg">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Tambah Baris
                  </Button>
                </div>

                <div className="space-y-3">
                  {specifications.length === 0 ? (
                    <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-slate-400 text-xs font-bold uppercase tracking-wider">
                      Belum ada fasilitas yang dicatat.
                    </div>
                  ) : (
                    specifications.map((spec, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Input placeholder="Nama (Cth: Proyektor)" value={spec.label} onChange={(e) => updateSpecification(index, 'label', e.target.value)} className="flex-1 text-sm h-11 rounded-xl bg-white" />
                        <Input placeholder="Detail (Cth: 2 Unit)" value={spec.value} onChange={(e) => updateSpecification(index, 'value', e.target.value)} className="flex-1 text-sm h-11 rounded-xl bg-white" />
                        <Button type="button" variant="outline" size="icon" onClick={() => removeSpecification(index)} className="h-11 w-11 shrink-0 rounded-xl text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="px-8 py-5 bg-white border-t border-slate-100 sm:justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">Batal</Button>
              <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-sm shadow-blue-200 px-6">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-2 h-4 w-4"/>}
                Simpan Konfigurasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}