// Lokasi file: src/app/admin/tenant/components/KanbanBoardTenant.tsx
import React, { useState } from 'react';
import { Tenant } from '@/types';
import { User, Activity, GripVertical, AlertCircle } from 'lucide-react';

interface Props {
  tenants: Tenant[];
  onUpdateStage: (tenantId: string, newStage: string) => void;
  onViewProfile: (tenant: Tenant) => void;
}

const STAGES = [
  { id: 'Pra-Inkubasi', title: 'Pra-Inkubasi', color: 'border-slate-300 bg-slate-100 text-slate-700' },
  { id: 'Validasi Ide', title: 'Validasi Ide', color: 'border-purple-300 bg-purple-100 text-purple-700' },
  { id: 'Pengembangan Produk', title: 'Pengemb. Produk', color: 'border-blue-300 bg-blue-100 text-blue-700' },
  { id: 'Go-To-Market', title: 'Go-To-Market', color: 'border-amber-300 bg-amber-100 text-amber-700' },
  { id: 'Alumni', title: 'Lulus / Alumni', color: 'border-emerald-300 bg-emerald-100 text-emerald-700' }
];

export default function KanbanBoardTenant({ tenants, onUpdateStage, onViewProfile }: Props) {
  const [draggedTenantId, setDraggedTenantId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, tenantId: string) => {
    setDraggedTenantId(tenantId);
    e.dataTransfer.setData('tenantId', tenantId);
    setTimeout(() => { (e.target as HTMLElement).style.opacity = '0.5'; }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedTenantId(null);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const tenantId = e.dataTransfer.getData('tenantId');
    if (tenantId) onUpdateStage(tenantId, targetStage);
  };

  // Fungsi helper warna titik Health Score
  const getHealthDotColor = (score?: string) => {
    if (score === 'Healthy') return 'bg-emerald-500 shadow-emerald-200';
    if (score === 'Warning') return 'bg-amber-500 shadow-amber-200';
    if (score === 'Critical') return 'bg-red-500 shadow-red-200 animate-pulse';
    return 'bg-slate-300';
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 custom-scrollbar min-h-[600px] items-start animate-in fade-in zoom-in-95 duration-300">
      {STAGES.map((stage) => {
        const stageTenants = tenants.filter(t => (t.pipelineStage || 'Pra-Inkubasi') === stage.id);

        return (
          <div 
            key={stage.id} 
            className="flex-shrink-0 w-80 bg-slate-50/80 border border-slate-200 rounded-3xl flex flex-col max-h-[80vh] overflow-hidden shadow-sm"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Header Kolom */}
            <div className="px-5 py-4 border-b border-slate-200 bg-white/50 backdrop-blur-sm flex justify-between items-center">
              <h3 className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm ${stage.color}`}>
                {stage.title}
              </h3>
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center">
                {stageTenants.length}
              </span>
            </div>

            {/* Area Kartu Drop */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {stageTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tenant.id!)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onViewProfile(tenant)}
                  className={`bg-white border p-4 rounded-2xl shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 transition-all group relative overflow-hidden ${draggedTenantId === tenant.id ? 'border-dashed border-blue-400 bg-blue-50' : 'border-slate-200'}`}
                >
                  {/* Indikator Health Score Garis Samping Kiri */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${getHealthDotColor(tenant.currentHealthScore)}`} />

                  <div className="flex justify-between items-start mb-3 pl-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {tenant.logoUrl ? <img src={tenant.logoUrl} alt="logo" className="w-full h-full object-contain p-1" /> : <span className="font-black text-slate-300 text-sm">{tenant.name.charAt(0)}</span>}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 tracking-tight leading-tight group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                          {tenant.name}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{tenant.segment || 'StartUp'}</span>
                      </div>
                    </div>
                    <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="space-y-1.5 pl-1">
                    <p className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400" /> {tenant.ownerName}
                    </p>
                    <p className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5 truncate">
                      <Activity className="w-3 h-3 text-slate-400" /> {tenant.sector}
                    </p>
                  </div>

                  {/* FASE 3: INDIKATOR STATUS CALON TENANT BARU */}
                  {tenant.status === 'Menunggu Review' && (
                    <div className="mt-3 pl-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-md uppercase tracking-wider">
                        <AlertCircle size={12} /> Menunggu Review
                      </span>
                    </div>
                  )}

                  {tenant.mentor && (
                     <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between pl-1">
                       <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded border border-indigo-100">Mentor</span>
                       <span className="text-[11px] font-bold text-slate-700">{tenant.mentor}</span>
                     </div>
                  )}
                </div>
              ))}
              
              {stageTenants.length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50/50">Tarik kartu ke sini</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}