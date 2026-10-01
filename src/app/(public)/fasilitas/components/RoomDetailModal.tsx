import React, { useState, useEffect } from 'react';
import { X, MapPin, Info, Users, LayoutTemplate, CheckCircle2, CalendarIcon, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Asset } from '@/types';

export default function RoomDetailModal({ 
  isOpen, 
  onClose, 
  room, 
  onBook 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  room: Asset | null; 
  onBook: (r: Asset) => void;
}) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [room]);

  if (!room) return null;
  const isKomersial = room.isRentable === true || String(room.isRentable) === 'true';
  const harga = Number(room.priceValue) || 0;

  let specs: any[] = [];
  try { 
    specs = JSON.parse(room.facilities || '[]'); 
    if (!Array.isArray(specs)) specs = [{ label: 'Fasilitas', value: room.facilities }]; 
  } catch { 
    specs = [{ label: 'Fasilitas', value: room.facilities }]; 
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-[850px] p-0 overflow-hidden bg-white sm:rounded-[2rem] rounded-t-[2rem] rounded-b-none sm:rounded-b-[2rem] border-0 shadow-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col focus:outline-none fixed bottom-0 sm:bottom-auto">
        <DialogTitle className="sr-only">Detail Ruangan {room.name}</DialogTitle>
        
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto sm:hidden mt-3 mb-1 shrink-0"></div>

        {/* Cover Image Header */}
        <div className="h-52 sm:h-72 relative shrink-0 bg-slate-100 group">
          {room.imageUrl && !imgError ? (
            <img src={room.imageUrl} alt={room.name} onError={() => setImgError(true)} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
              <ImageIcon size={44} className="opacity-40" />
            </div>
          )}
          
          {/* Subtle Scrim for readable title */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
          
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 sm:top-5 sm:right-5 w-8 h-8 sm:w-9 sm:h-9 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors z-20 shadow-xs"
            aria-label="Tutup Detail"
          >
            <X size={18} />
          </button>
          
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 z-10">
            <span className="inline-block px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-md mb-1.5 shadow-xs">
              {room.category || 'Fasilitas'}
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-sm mb-1">{room.name}</h2>
            <p className="text-xs sm:text-sm font-medium text-slate-200 flex items-center gap-1.5">
              <MapPin size={13} className="text-blue-400 shrink-0"/> {room.location || 'Solo Technopark'}
            </p>
          </div>
        </div>

        {/* Scrollable Content Details */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Kolom Kiri: Deskripsi & Spesifikasi */}
            <div className="md:col-span-2 space-y-5">
              <div>
                <h3 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-1.5">
                  <Info size={15} className="text-blue-500"/> Tentang Fasilitas
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {room.description || `Fasilitas representatif di Solo Technopark yang dirancang untuk mendukung berbagai agenda meeting, workshop, pelatihan, dan kegiatan industri.`}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-1.5">
                  <Sparkles size={15} className="text-amber-500"/> Spesifikasi & Kelengkapan
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                   <div className="p-3 bg-slate-50/80 rounded-2xl flex items-center gap-3 border border-slate-100">
                     <div className="w-9 h-9 bg-white rounded-xl shadow-xs flex items-center justify-center text-blue-600 shrink-0">
                       <Users size={18}/>
                     </div>
                     <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Kapasitas</p>
                       <p className="text-xs sm:text-sm font-black text-slate-800">{room.capacity ? `${room.capacity} Orang` : 'Fleksibel'}</p>
                     </div>
                   </div>

                   <div className="p-3 bg-slate-50/80 rounded-2xl flex items-center gap-3 border border-slate-100">
                     <div className="w-9 h-9 bg-white rounded-xl shadow-xs flex items-center justify-center text-amber-600 shrink-0">
                       <LayoutTemplate size={18}/>
                     </div>
                     <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Layout</p>
                       <p className="text-xs sm:text-sm font-black text-slate-800 truncate">{room.layout || 'Bebas Atur'}</p>
                     </div>
                   </div>

                   {specs.map((s, i) => (
                     <div key={i} className="p-3 border border-slate-100 bg-white rounded-2xl flex items-center gap-2.5 shadow-xs col-span-2 sm:col-span-1">
                       <CheckCircle2 size={16} className="text-emerald-500 shrink-0"/>
                       <div className="min-w-0">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                         <p className="text-xs font-bold text-slate-800 truncate">{s.value}</p>
                       </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Desktop Sticky Sidebar */}
            <div className="hidden md:block md:col-span-1">
              <div className="bg-slate-50/80 rounded-2xl p-5 sticky top-0 border border-slate-100 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ringkasan Tarif</p>
                {isKomersial && harga > 0 ? (
                  <div className="mb-4">
                    <p className="text-2xl font-black text-slate-900 tracking-tight">Rp {harga.toLocaleString('id-ID')}</p>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">/ {room.pricingType || 'Sewa'}</p>
                  </div>
                ) : (
                  <div className="mb-4 bg-emerald-50 text-emerald-700 p-2.5 rounded-xl text-center border border-emerald-100">
                    <p className="font-bold text-xs">Gratis (Internal STP)</p>
                  </div>
                )}
                
                <Button 
                  onClick={() => onBook(room)} 
                  className="w-full rounded-full h-11 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                >
                  <CalendarIcon className="w-4 h-4 mr-1.5" /> Pesan Jadwal
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Sticky Bottom CTA Bar */}
        <div className="md:hidden border-t border-slate-100 bg-white p-3.5 px-4 flex items-center justify-between gap-3 shrink-0 shadow-lg">
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tarif Sewa</p>
            {isKomersial && harga > 0 ? (
              <p className="text-base font-black text-slate-900 leading-none">
                Rp {harga.toLocaleString('id-ID')} <span className="text-[10px] font-normal text-slate-500">/{room.pricingType || 'Sewa'}</span>
              </p>
            ) : (
              <p className="text-sm font-black text-emerald-600 leading-none">Gratis (Internal)</p>
            )}
          </div>

          <Button 
            onClick={() => onBook(room)} 
            className="rounded-full h-10 px-5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            <CalendarIcon className="w-3.5 h-3.5 mr-1.5" /> Pesan Jadwal
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}