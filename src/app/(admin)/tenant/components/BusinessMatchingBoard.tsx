// Lokasi file: src/app/admin/tenant/components/BusinessMatchingBoard.tsx
import React from 'react';
import { Tenant } from '@/types';
import { Briefcase, Mail, Building, Handshake, Target, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  tenants: Tenant[];
  onViewProfile: (tenant: Tenant) => void;
}

export default function BusinessMatchingBoard({ tenants, onViewProfile }: Props) {
  // Hanya tampilkan tenant yang sedang mencari pendanaan (isRaising)
  const raisingTenants = tenants.filter(t => t.isRaising);

  if (raisingTenants.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-16 flex flex-col items-center justify-center text-center animate-in fade-in">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <Handshake className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-black text-slate-700 tracking-tight">Tidak Ada Tenant Fundraising</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md">Saat ini tidak ada tenant inkubator yang sedang dalam masa pencarian pendanaan eksternal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-blue-900/20 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-2"><Briefcase className="text-blue-300" /> Katalog Investasi & Business Matching</h2>
          <p className="text-blue-100 text-sm max-w-2xl">Daftar eksklusif startup binaan Inkubator yang telah tervalidasi, memiliki traksi, dan siap untuk tahap pendanaan selanjutnya (Seed / Series A).</p>
        </div>
        <div className="relative z-10 shrink-0 text-center bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Total Pipeline</p>
          <p className="text-3xl font-black">{raisingTenants.length} <span className="text-sm font-medium opacity-80">Startup</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {raisingTenants.map((tenant) => (
          <div key={tenant.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition-all group flex flex-col">
            
            {/* Header / Cover Image */}
            <div className="h-32 bg-slate-100 relative">
              {tenant.coverImageUrl ? (
                <img src={tenant.coverImageUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
              )}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/50 shadow-sm flex items-center gap-1.5 text-xs font-black text-slate-800">
                <ShieldCheck size={14} className="text-blue-500" /> Terverifikasi
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col relative">
              {/* Logo (Overlapping) */}
              <div className="w-16 h-16 bg-white rounded-2xl border-4 border-white shadow-md absolute -top-8 left-6 flex items-center justify-center overflow-hidden">
                 {tenant.logoUrl ? <img src={tenant.logoUrl} className="w-full h-full object-contain p-1" /> : <Building className="w-8 h-8 text-slate-300" />}
              </div>

              <div className="mt-8 mb-4">
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">{tenant.name}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{tenant.sector}</p>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-6 flex-1">
                {tenant.elevatorPitch || tenant.companyDescription || 'Tidak ada deskripsi singkat (Elevator Pitch).'}
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Target size={12}/> Kebutuhan Pendanaan</p>
                <p className="text-base font-black text-indigo-700">{tenant.fundingStage}</p>
                {tenant.currentNeeds && tenant.currentNeeds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {tenant.currentNeeds.slice(0, 3).map((need, idx) => (
                      <span key={idx} className="bg-white border border-slate-200 text-slate-600 text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider">{need}</span>
                    ))}
                    {tenant.currentNeeds.length > 3 && <span className="bg-slate-200 text-slate-600 text-[9px] font-bold px-2 py-1 rounded">+{tenant.currentNeeds.length - 3}</span>}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-auto">
                <button onClick={() => onViewProfile(tenant)} className="flex-1 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-bold transition-all text-center">
                  Detail Profil
                </button>
                <a href={`mailto:${tenant.email}?subject=Ketertarikan Investasi - ${tenant.name}`} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all shadow-md flex items-center justify-center w-12 shrink-0">
                  <Mail size={18} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}