// Lokasi file: src/app/(public)/e-katalog/components/ProductCard.tsx

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Image as ImageIcon, Store, Building2, MessageCircle, ExternalLink, CalendarDays, ShoppingCart, ArrowRight } from 'lucide-react';
import { ProductCatalog } from '@/types';
import { getThumbnailUrl } from '@/lib/imageUtils';

interface ProductCardProps {
  product: ProductCatalog;
}

export default function ProductCard({ product }: ProductCardProps) {
  const rawImageUrl = product.images && product.images.length > 0 ? product.images[0] : null;
  const imageUrl = getThumbnailUrl(rawImageUrl);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="public-card public-card-hover group relative flex flex-col h-full overflow-hidden z-10">
      
      {/* Area Media Gambar & Floating Badges */}
      <div className="public-card-media aspect-video relative">
        <Link 
          href={`/e-katalog/${product.id}`} 
          prefetch={true} 
          className="block w-full h-full relative overflow-hidden"
          title={`Lihat detail ${product.name}`}
        >
          {imageUrl && imageUrl !== '/placeholder-image.jpg' && !imgError ? (
            <Image 
              src={imageUrl} 
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
              <ImageIcon size={32} className="mb-2 opacity-30" />
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">Tanpa Gambar</span>
            </div>
          )}
          <div className="public-card-scrim" />
        </Link>

        {/* Badge Kategori */}
        <div className="public-card-badge-top-left pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md text-slate-800 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest shadow-xs">
            {product.category}
          </div>
        </div>

        {/* Badge Kepemilikan */}
        <div className="public-card-badge-top-right pointer-events-none">
          {product.ownerType?.toUpperCase() === 'TENANT' ? (
            <div className="bg-amber-50 text-amber-800 text-[10px] px-2.5 py-1 rounded-full font-bold shadow-xs flex items-center gap-1.5">
              <Store size={12} /> <span className="max-w-[80px] truncate">{product.tenantName || 'Tenant'}</span>
            </div>
          ) : (
            <div className="bg-blue-50 text-blue-800 text-[10px] px-2.5 py-1 rounded-full font-bold shadow-xs flex items-center gap-1.5">
              <Building2 size={12} /> Internal
            </div>
          )}
        </div>
      </div>

      {/* Konten Text Elegan Menggunakan Card Anatomy */}
      <div className="public-card-body">
        <h3 className="public-card-title group-hover:text-emerald-600" title={product.name}>
          <Link href={`/e-katalog/${product.id}`} prefetch={true} className="hover:text-emerald-600 transition-colors">
            {product.name}
          </Link>
        </h3>
        
        <p className="public-card-desc mb-4">
          {product.shortDescription || product.description}
        </p>

        {/* Highlight Poin Minimalis */}
        {product.highlights && product.highlights.length > 0 && (
          <div className="space-y-1.5 mb-4 mt-auto">
            {product.highlights.slice(0, 2).map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{h}</span>
              </div>
            ))}
          </div>
        )}

        {/* Area Harga */}
        <div className="public-card-footer">
          <div>
            <span className="public-card-price-label">Mulai dari</span>
            <p className="public-card-price text-slate-900">
              Rp {product.price?.toLocaleString('id-ID')}
              <span className="text-slate-400 text-[11px] font-bold">/{product.pricingType}</span>
            </p>
            {product.isNegotiable && (
              <span className="inline-block mt-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Bisa Nego
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}