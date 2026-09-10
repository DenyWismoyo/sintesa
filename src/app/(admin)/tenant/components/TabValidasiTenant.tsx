// Lokasi file: src/app/admin/tenant/components/TabValidasiTenant.tsx
import React, { useState } from 'react';
import { Search, ShieldAlert, ArrowRight, Clock, Building, User, Target, Sparkles, AlertCircle } from 'lucide-react';
import { Tenant } from '@/types';

interface Props {
  tenants: Tenant[];
  onReview: (tenant: Tenant) => void;
}

export default function TabValidasiTenant({ tenants, onReview }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const pendingTenants = tenants.filter(t => t.status === 'Menunggu Review');
  const filteredTenants = pendingTenants.filter(tenant => 
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tenant.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="p-6 pb-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-black text-amber-800 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-amber-600" /> Validasi Pendaftar Baru
            </h2>
            <p className="text-sm text-slate-500 mt-1">Tinjau profil komprehensif pendaftar dari hasil AI Smart Curation.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama usaha atau pemilik..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="p-6 pt-2">
        {filteredTenants.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
             <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 font-bold">Tidak ada pendaftar baru yang menunggu review saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTenants.map(tenant => {
              const selfAsses = tenant.selfAssessment as any;
              const trackType = selfAsses?.trackType || tenant.segment || 'Umum';
              
              return (
                <div key={tenant.id} className="bg-white border border-amber-200 rounded-2xl p-5 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100 transition-all group flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl flex items-center gap-1">
                    <Clock size={10} /> Menunggu
                  </div>

                  <div className="flex items-start gap-4 mb-4 mt-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {tenant.logoUrl ? <img src={tenant.logoUrl} className="w-full h-full object-contain p-1" /> : <Building className="w-6 h-6 text-slate-300" />}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 tracking-tight leading-tight group-hover:text-amber-600 transition-colors line-clamp-1">
                        {tenant.name}
                      </h3>
                      <div className="flex gap-1 mt-1.5">
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider px-2 py-0.5 rounded">{trackType}</span>
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider px-2 py-0.5 rounded truncate max-w-[100px]">{tenant.sector}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 flex-1 bg-gradient-to-br from-amber-50 to-orange-50/30 rounded-xl p-4 border border-amber-100/50">
                    <div className="flex items-center gap-2 mb-2 border-b border-amber-100/50 pb-2">
                      <User size={14} className="text-amber-600"/>
                      <span className="text-xs font-semibold text-slate-700 truncate">{tenant.ownerName}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1"><Sparkles size={10} className="text-amber-500"/> AI Score</span>
                        <span className="text-lg font-black text-slate-800">{tenant.aiCurationData?.totalScore || '0'} <span className="text-xs text-slate-400 font-medium">/100</span></span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">Readiness</span>
                        <p className="text-xs font-bold text-emerald-600">{tenant.aiCurationData?.readinessLevel || 'TBA'}</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => onReview(tenant)}
                    className="w-full py-2.5 bg-slate-900 text-white hover:bg-amber-500 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-slate-200"
                  >
                    Buka Data Room & Putuskan <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}