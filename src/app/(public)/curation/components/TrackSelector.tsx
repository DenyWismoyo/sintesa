'use client';

import React, { useState } from 'react';
import { Rocket, Store, Briefcase, ArrowRight, ChevronLeft } from 'lucide-react';

export type TrackType = 'UMKM' | 'Startup' | 'Jasa' | null;

interface Props {
  onSelect: (track: TrackType) => void;
  onBack: () => void;
}

export default function TrackSelector({ onSelect, onBack }: Props) {
  const [selected, setSelected] = useState<TrackType>(null);

  const tracks = [
    {
      id: 'Startup',
      title: 'Startup Teknologi',
      desc: 'Aplikasi, SaaS, atau Platform Digital. Berfokus pada Product-Market Fit, traksi eksponensial pengguna, dan metrik valuasi VC.',
      icon: Rocket,
      color: 'indigo'
    },
    {
      id: 'UMKM',
      title: 'UMKM & Produk Fisik',
      desc: 'F&B, Fashion, Kriya, atau Manufaktur. Berfokus pada kapasitas produksi harian, standar legalitas (BPOM/Halal), dan kesiapan ekspor.',
      icon: Store,
      color: 'emerald'
    },
    {
      id: 'Jasa',
      title: 'Bisnis Jasa / Agensi',
      desc: 'Software House, Konsultan, atau Digital Agency. Berfokus pada manajemen tim, siklus retainer klien, dan skalabilitas operasi.',
      icon: Briefcase,
      color: 'blue'
    }
  ];

  return (
    <div className="w-full min-h-[calc(100vh-5.5rem)] flex flex-col items-center justify-center bg-slate-50 px-6 lg:px-16 py-12 relative">
      <div className="w-full max-w-7xl mx-auto animate-in slide-in-from-bottom-8 duration-700">
        
        <button onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-8 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 w-fit">
          <ChevronLeft size={16} /> Kembali
        </button>
        
        <div className="mb-10 lg:mb-16">
          <h2 className="text-3xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tight">Pilih Model Bisnis Anda</h2>
          <p className="text-slate-500 text-base lg:text-lg max-w-2xl">
            Pilih kategori yang paling mendeskripsikan model operasi bisnis Anda saat ini agar matriks AI kami dapat mengkalibrasi pertanyaan dengan tepat.
          </p>
        </div>
        
        {/* Bento Grid layout untuk layar lebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {tracks.map((track) => {
            const Icon = track.icon;
            const isSelected = selected === track.id;
            
            return (
              <div 
                key={track.id}
                onClick={() => setSelected(track.id as TrackType)}
                className={`relative overflow-hidden cursor-pointer rounded-[2rem] p-8 lg:p-10 transition-all duration-300 group min-h-[300px] flex flex-col border-2 ${
                  isSelected 
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 scale-[1.02]' 
                    : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:bg-slate-50 hover:-translate-y-2 hover:shadow-xl'
                }`}
              >
                {/* Background Icon Watermark */}
                <Icon size={180} className={`absolute -bottom-10 -right-10 transition-opacity duration-300 ${isSelected ? 'opacity-10 text-white' : 'opacity-5 text-slate-900 group-hover:text-indigo-900 group-hover:opacity-10'}`} />
                
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shrink-0 transition-colors ${isSelected ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                   <Icon size={32} />
                </div>
                
                <div className="relative z-10 flex-1">
                   <h3 className={`font-black text-2xl lg:text-3xl mb-3 tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>{track.title}</h3>
                   <p className={`text-sm lg:text-base font-medium leading-relaxed ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>{track.desc}</p>
                </div>

                {/* Radio indicator */}
                <div className={`absolute top-8 right-8 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-white' : 'border-slate-300'}`}>
                   {isSelected && <div className="w-3 h-3 bg-white rounded-full" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button 
            onClick={() => selected && onSelect(selected)} 
            disabled={!selected}
            className="w-full lg:w-auto px-12 py-5 bg-slate-900 text-white font-bold rounded-full hover:bg-indigo-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-indigo-600/30 text-lg flex items-center justify-center gap-3"
          >
            Lanjutkan ke Asesmen <ArrowRight size={20} />
          </button>
        </div>

      </div>
    </div>
  );
}