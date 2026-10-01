'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, Store, ShieldCheck, MapPin, ExternalLink, ArrowRight } from 'lucide-react';

export interface ProviderCardProps {
  ownerType?: 'INTERNAL' | 'TENANT' | string;
  tenantName?: string;
  tenantId?: string;
  location?: string;
  className?: string;
}

export default function ProviderCard({
  ownerType = 'INTERNAL',
  tenantName,
  tenantId,
  location = 'Kawasan Solo Technopark',
  className = ''
}: ProviderCardProps) {
  const isTenant = ownerType?.toUpperCase() === 'TENANT';

  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_-2px_rgba(15,23,42,0.04)] border-0 flex items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3.5 min-w-0">
        
        {/* Avatar / Logo Lingkaran */}
        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center shrink-0 relative overflow-hidden shadow-xs">
          {isTenant ? (
            <Store className="w-6 h-6 text-amber-600" />
          ) : (
            <Image
              src="/logo.png"
              alt="Solo Technopark"
              width={40}
              height={40}
              className="w-8 h-auto object-contain"
            />
          )}
        </div>

        {/* Text Details */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm font-black text-slate-900 truncate">
              {isTenant ? (tenantName || 'Tenant Mitra') : 'Solo Technopark'}
            </h4>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              <ShieldCheck size={12} className="text-emerald-600" />
              {isTenant ? 'Tenant Resmi' : 'Resmi Kawasan'}
            </span>
          </div>

          <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5 truncate">
            <MapPin size={12} className="shrink-0 text-slate-400" />
            <span className="truncate">{location}</span>
          </p>
        </div>

      </div>

      {/* Action / Detail Link jika Tenant */}
      {isTenant && tenantId && (
        <Link
          href={`/ekosistem/${tenantId}`}
          className="shrink-0 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors"
          title="Lihat profil tenant"
        >
          <span>Profil</span>
          <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}
