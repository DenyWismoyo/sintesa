import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Users, MapPin, Building2, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { Asset } from '@/types';
import OptimizedImage from '@/components/ui/OptimizedImage';
import StatusBadge from '@/components/ui/StatusBadge';

interface RoomCardProps {
  room: Asset;
  onShowDetail: (room: Asset) => void;
  onBook: (room: Asset) => void;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function RoomCard({ room, onShowDetail, onBook }: RoomCardProps) {
  const isKomersial = room.isRentable === true || String(room.isRentable) === 'true';
  const harga = Number(room.priceValue) || 0;

  return (
    <motion.div 
      variants={itemVariants} 
      className="public-card public-card-hover w-full h-full overflow-hidden group flex flex-col cursor-pointer relative"
      onClick={() => onShowDetail(room)}
    >
      {/* Area Gambar dengan Scrim dan Floating Badges */}
      <div className="public-card-media aspect-video">
        <OptimizedImage 
          src={room.imageUrl} 
          alt={room.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" 
        />
        
        <div className="public-card-scrim" />
        
        {/* Badge Kategori */}
        <div className="public-card-badge-top-left">
          <StatusBadge 
            label={room.category}
            variant="default"
            size="sm"
            className="bg-white/95 backdrop-blur-md font-bold"
          />
        </div>
        
        {/* Badge Kapasitas */}
        <div className="public-card-badge-bottom-left">
          <div className="flex items-center gap-1.5 text-white text-[10px] sm:text-xs font-semibold bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 shadow-xs">
            <Users size={13} className="text-sky-300" /> 
            {room.capacity ? `${room.capacity} Orang` : 'Kapasitas Fleksibel'}
          </div>
        </div>
      </div>
      
      {/* Area Konten */}
      <div className="public-card-body">
        <h3 className="public-card-title group-hover:text-sky-600">
          {room.name}
        </h3>
        
        <p className="public-card-meta mb-4">
          <MapPin size={14} className="text-sky-500 shrink-0" /> 
          <span className="truncate">{room.location}</span>
        </p>
        
        {/* Footer: Harga & Tombol Aksi */}
        <div className="public-card-footer">
          <div className="flex-1">
            {isKomersial && harga > 0 ? (
              <div className="flex flex-col">
                <span className="public-card-price-label">Tarif Sewa</span>
                <p className="public-card-price text-sky-700">
                  Rp {harga.toLocaleString('id-ID')} 
                  <span className="text-[10px] sm:text-xs text-slate-400 font-bold">/{room.pricingType}</span>
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="public-card-price-label">Status Fasilitas</span>
                <p className="text-xs sm:text-sm font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full w-fit">
                  <Building2 size={13} className="shrink-0"/> Internal
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}