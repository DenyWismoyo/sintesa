'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { HUB_TYPES } from './CreateThreadModal';

export const HUB_ROLES = [
  { id: 'All', label: 'Semua Aktor' },
  { id: 'industri', label: 'Industri' },
  { id: 'kampus', label: 'Kampus' },
  { id: 'investor', label: 'Investor' },
  { id: 'tenant', label: 'Startup' }
];

interface HubThreadFiltersProps {
  activeRole: string;
  onRoleChange: (roleId: string) => void;
  activeType: string;
  onTypeChange: (typeId: string) => void;
  onOpenCreateModal: () => void;
}

export default function HubThreadFilters({
  activeRole,
  onRoleChange,
  activeType,
  onTypeChange,
  onOpenCreateModal
}: HubThreadFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Action Card: Call to Collaborate */}
      <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
        <h3 className="font-black text-xl mb-2 relative z-10 tracking-tight">Punya Kebutuhan?</h3>
        <p className="text-indigo-100 text-xs sm:text-sm mb-5 relative z-10 leading-relaxed">
          Buat thread untuk mencari solusi inovasi, riset, pendanaan, atau tawarkan kerjasama kemitraan ke jejaring ekosistem.
        </p>
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="w-full bg-white text-indigo-700 hover:bg-indigo-50 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98"
        >
          <Plus size={18} /> Buat Thread Baru
        </button>
      </div>

      {/* Filter Role / Aktor */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Filter Aktor</h4>
        <div className="flex flex-col gap-1.5">
          {HUB_ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => onRoleChange(role.id)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeRole === role.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{role.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Type / Topik */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Filter Topik</h4>
        <div className="flex flex-col gap-1.5">
          {HUB_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => onTypeChange(type.id)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeType === type.id
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                  : 'bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent hover:text-slate-900'
              }`}
            >
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
