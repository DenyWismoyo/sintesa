import React, { useState, useEffect } from 'react';
import { X, MapPin, Info, Users, LayoutTemplate, CheckCircle2, CalendarIcon, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Asset } from '@/types';

export default function RoomDetailModal({ isOpen, onClose, room, onBook }: { isOpen: boolean, onClose: () => void, room: Asset | null, onBook: (r: Asset) => void }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [room]);

  if (!room) return null;
  const isKomersial = room.isRentable === true || String(room.isRentable) === 'true';
  const harga = Number(room.priceValue) || 0;

  let specs: any[] = [];
  try { specs = JSON.parse(room.facilities || '[]'); if(!Array.isArray(specs)) specs = [{label: 'Fasilitas', value: room.facilities}]; } 
  catch { specs = [{label: 'Fasilitas', value: room.facilities}]; }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden bg-white rounded-[2rem] border-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] max-h-[90vh] flex flex-col focus:outline-none">
        <DialogTitle className="sr-only">Detail Ruangan {room.name}</DialogTitle>
        
        {/* Cover Image Header */}
        <div className="h-64 sm:h-80 relative shrink-0 bg-slate-100 group">
          {room.imageUrl && !imgError ? (
            <img src={room.imageUrl} alt={room.name} onError={() => setImgError(true)} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={48} /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
          
          <button onClick={onClose} className="absolute top-5 right-5 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors">
            <X size={20} />
          </button>
          
          <div className="absolute bottom-6 left-6 right-6">
            <span className="inline-block px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg mb-3 shadow-sm">{room.category}</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mb-2 drop-shadow-md">{room.name}</h2>
            <p className="text-sm font-medium text-slate-300 flex items-center gap-1.5"><MapPin size={16} className="text-blue-400"/> {room.location}</p>
          </div>
        </div>

        {/* Content Details */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2"><Info className="text-slate-400"/> Deskripsi</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {room.description || `Fasilitas premium yang dirancang untuk mendukung berbagai kegiatan. Terletak strategis di ${room.location}.`}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 mb-4">Spesifikasi & Fasilitas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="p-4 bg-slate-50 rounded-[1rem] flex items-center gap-4">
                     <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 shrink-0"><Users size={24}/></div>
                     <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kapasitas</p><p className="text-sm font-black text-slate-800">{room.capacity ? `${room.capacity} Orang` : 'Fleksibel'}</p></div>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-[1rem] flex items-center gap-4">
                     <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500 shrink-0"><LayoutTemplate size={24}/></div>
                     <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Layout</p><p className="text-sm font-black text-slate-800">{room.layout || 'Bebas Atur'}</p></div>
                   </div>
                   {specs.map((s, i) => (
                     <div key={i} className="p-4 border border-slate-100 rounded-[1rem] flex items-center gap-4">
                       <CheckCircle2 size={24} className="text-emerald-500 shrink-0"/>
                       <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p><p className="text-sm font-bold text-slate-800 line-clamp-1">{s.value}</p></div>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            {/* Right Sticky Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-slate-50 rounded-[1.5rem] p-6 sticky top-0 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Ringkasan Tarif</p>
                {isKomersial && harga > 0 ? (
                  <div className="mb-6">
                    <p className="text-3xl font-black text-slate-900 tracking-tight">Rp {harga.toLocaleString('id-ID')}</p>
                    <p className="text-sm font-bold text-slate-500 mt-1">/ {room.pricingType || 'Sewa'}</p>
                  </div>
                ) : (
                  <div className="mb-6 bg-emerald-100/50 text-emerald-700 p-4 rounded-xl text-center">
                    <p className="font-black text-lg">Gratis (Internal)</p>
                  </div>
                )}
                
                <Button onClick={() => onBook(room)} className="w-full rounded-xl h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200">
                  <CalendarIcon className="w-5 h-5 mr-2" /> Pesan Jadwal
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}