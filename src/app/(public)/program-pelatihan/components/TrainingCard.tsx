// Lokasi file: src/app/(public)/program-pelatihan/components/TrainingCard.tsx

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Clock, Award, Calendar, UserCircle2, MapPin, 
  ArrowRight, Sparkles, GraduationCap 
} from 'lucide-react';
import { Training } from '@/types';
import { formatRupiah } from '@/utils/format';

interface TrainingCardProps {
  training: Training;
}

export default function TrainingCard({ training }: TrainingCardProps) {
  const [imgError, setImgError] = useState(false);
  const isFull = (training.quota || 0) > 0 && (training.registeredCount || 0) >= (training.quota || 0);

  // Helper level badge styling
  const getLevelBadgeClass = (level: string = 'Pemula') => {
    switch (level) {
      case 'Mahir':
        return 'bg-purple-50/95 text-purple-700 border-purple-200/80';
      case 'Menengah':
        return 'bg-amber-50/95 text-amber-800 border-amber-200/80';
      default:
        return 'bg-emerald-50/95 text-emerald-800 border-emerald-200/80';
    }
  };

  // Format tanggal batch
  const getFormattedDate = (dateStr?: string) => {
    if (!dateStr) return 'Jadwal Reguler STP';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const primaryInstructor = training.instructors && training.instructors.length > 0 
    ? training.instructors[0].name 
    : 'Instruktur Vokasi STP';

  const simplifiedCert = training.certificationType 
    ? training.certificationType.replace(/Sertifikat\s*(Kompetensi\s*)?/i, '').replace(/Solo Technopark\s*(&\s*)?/i, '')
    : 'BNSP';

  return (
    <div className="public-card public-card-hover group relative flex flex-col h-full overflow-hidden z-10 transition-all duration-300">
      
      {/* 1. Header Media & Floating Badges */}
      <div className="public-card-media h-52 sm:h-56 relative overflow-hidden">
        <Link 
          href={`/program-pelatihan/${training.id}`}
          className="block w-full h-full relative overflow-hidden"
          title={`Lihat kurikulum & detail ${training.title}`}
        >
          {training.imageUrl && !imgError ? (
            <Image 
              src={training.imageUrl} 
              alt={training.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
              <GraduationCap size={36} className="mb-2 opacity-30 text-amber-500" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Solo Technopark</span>
            </div>
          )}
          <div className="public-card-scrim" />
        </Link>

        {/* Badge Kategori (Top Left) */}
        <div className="public-card-badge-top-left pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md text-amber-900 border border-amber-200/60 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-2xs">
            {training.category || 'Pelatihan'}
          </div>
        </div>

        {/* Badge Level & Status Penuh (Top Right) */}
        <div className="public-card-badge-top-right pointer-events-none flex flex-col items-end gap-1.5">
          <div className={`text-[10px] px-2.5 py-1 rounded-full font-bold shadow-2xs border backdrop-blur-md flex items-center gap-1 ${getLevelBadgeClass(training.level)}`}>
            <Sparkles size={11} /> {training.level || 'Pemula'}
          </div>
          {isFull && (
            <div className="bg-rose-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-2xs uppercase tracking-wider">
              Penuh
            </div>
          )}
        </div>

        {/* Badges Durasi & Sertifikasi (Bottom Left) */}
        <div className="public-card-badge-bottom-left pointer-events-none flex flex-wrap items-center gap-1.5 max-w-[90%]">
          {training.durationDisplay && (
            <span className="bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
              <Clock size={11} className="text-amber-400 shrink-0" />
              <span className="truncate">{training.durationDisplay}</span>
            </span>
          )}
          {simplifiedCert && (
            <span className="bg-emerald-950/80 backdrop-blur-md text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
              <Award size={11} className="text-emerald-400 shrink-0" />
              <span className="truncate">{simplifiedCert}</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Konten Text Mengikuti Standar Public Card Body */}
      <div className="public-card-body flex flex-col flex-1 p-5">
        
        {/* Judul Pelatihan */}
        <h3 className="public-card-title group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug mb-2" title={training.title}>
          <Link href={`/program-pelatihan/${training.id}`} className="hover:text-amber-600 transition-colors">
            {training.title}
          </Link>
        </h3>
        
        {/* Ringkasan Deskripsi */}
        <p className="public-card-desc line-clamp-2 mb-4 text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
          {training.description || 'Program sertifikasi kompetensi vokasi terapan dengan kurikulum industri resmi di Solo Technopark.'}
        </p>

        {/* Baris Metadata Informatif */}
        <div className="space-y-2 mb-5 mt-auto pt-2 border-t border-slate-100/80">
          {/* Jadwal Batch */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Calendar size={13} className="text-amber-500 shrink-0" />
            <span className="truncate">Batch: <strong className="text-slate-800">{getFormattedDate(training.date)}</strong></span>
          </div>

          {/* Instruktur Utama */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <UserCircle2 size={13} className="text-slate-400 shrink-0" />
            <span className="truncate" title={primaryInstructor}>{primaryInstructor}</span>
          </div>

          {/* Lokasi / Tipe */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <MapPin size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">Workshop Pengelasan STP</span>
          </div>
        </div>

        {/* 3. Footer Kartu: Biaya & Tombol Aksi */}
        <div className="public-card-footer mt-auto pt-3 border-t border-slate-100 flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1 pr-1">
            <span className="public-card-price-label block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
              Biaya Investasi
            </span>
            <p className="public-card-price text-slate-900 font-black text-base sm:text-lg leading-none truncate">
              {training.isFree ? (
                <span className="text-emerald-600">Gratis</span>
              ) : (
                formatRupiah(training.price || 0)
              )}
            </p>
          </div>

          {/* Action Button Circular Pill Micro-Interaction */}
          <Link 
            href={`/program-pelatihan/${training.id}`}
            className="public-card-action-btn group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xs group-hover:shadow-md shrink-0"
            title={`Lihat detail ${training.title}`}
          >
            <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

      </div>

    </div>
  );
}
