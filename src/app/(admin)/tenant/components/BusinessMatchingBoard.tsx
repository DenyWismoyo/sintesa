// Lokasi file: src/app/admin/tenant/components/BusinessMatchingBoard.tsx
import React from 'react';
import Link from 'next/link';
import { Tenant } from '@/types';
import { useAllPartners } from '@/hooks/usePartners';
import { Briefcase, Mail, Building, Handshake, Target, ArrowUpRight, ShieldCheck, Globe } from 'lucide-react';

interface Props {
  tenants: Tenant[];
  onViewProfile: (tenant: Tenant) => void;
}

export default function BusinessMatchingBoard({ tenants, onViewProfile }: Props) {
  const { data: partners = [] } = useAllPartners();
  const raisingTenants = tenants.filter(t => t.isRaising);
  const verifiedPartners = partners.filter(p => p.status === 'ACTIVE');

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-blue-900/20 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-2"><Briefcase className="text-blue-300" /> Katalog Investasi & Business Matching</h2>
          <p className="text-blue-100 text-sm max-w-2xl">Daftar eksklusif startup binaan Inkubator yang siap untuk pendanaan (Seed / Series A) terhubung langsung dengan jaringan Mitra Industri & Investor Resmi STP.</p>
        </div>
        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <div className="text-center bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3.5 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Startup Raising</p>
            <p className="text-2xl font-black">{raisingTenants.length}</p>
          </div>
          <div className="text-center bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3.5 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-1">Mitra & Investor</p>
            <p className="text-2xl font-black">{verifiedPartners.length}</p>
          </div>
        </div>
      </div>

      {/* SEKSI 1: STARTUP FUNDRAISING */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Target size={18} className="text-indigo-600" /> Pipeline Startup Siap Investasi ({raisingTenants.length})
          </h3>
        </div>

        {raisingTenants.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
              <Handshake className="w-8 h-8 text-slate-300" />
            </div>
            <h4 className="text-lg font-black text-slate-700 tracking-tight">Tidak Ada Tenant Fundraising</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md">Saat ini belum ada tenant yang mengaktifkan status pencarian pendanaan eksternal.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {raisingTenants.map((tenant) => (
              <div key={tenant.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition-all group flex flex-col">
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
        )}
      </div>

      {/* SEKSI 2: JARINGAN MITRA INDUSTRI & INVESTOR RESMI (DARI /KARIR) */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Handshake size={18} className="text-emerald-600" /> Direktori Mitra Industri & Investor Terverifikasi ({verifiedPartners.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Terhubung langsung dari Portal Kemitraan & Bursa Karir (/karir) untuk kolaborasi B2B dan investasi.</p>
          </div>
          <Link
            href="/karir"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 transition-colors w-fit"
          >
            Kelola Mitra di /karir <ArrowUpRight size={14} />
          </Link>
        </div>

        {verifiedPartners.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
            Belum ada Mitra Industri / Investor aktif yang dikonversi di menu Kemitraan (/karir).
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {verifiedPartners.map((partner) => (
              <div key={partner.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {partner.tier || 'CORPORATE'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{partner.industrySector || 'Industri'}</span>
                  </div>
                  <h4 className="font-black text-slate-800 text-base">{partner.companyName}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{partner.description || `Mitra resmi ekosistem Solo Technopark (${partner.location || 'Indonesia'}).`}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="font-semibold text-slate-600 truncate">PIC: {partner.picName || '-'}</span>
                  <div className="flex items-center gap-1.5">
                    {partner.websiteUrl && (
                      <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600" title="Website">
                        <Globe size={14} />
                      </a>
                    )}
                    {partner.picEmail && (
                      <a href={`mailto:${partner.picEmail}?subject=Business Matching Solo Technopark`} className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold inline-flex items-center gap-1">
                        <Mail size={13} /> Hubungi
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
