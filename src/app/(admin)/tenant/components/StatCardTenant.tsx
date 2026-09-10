import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  colorClass: string; 
}

export default function StatCardTenant({ title, value, icon, trend, colorClass }: StatCardProps) {
  const textColor = colorClass.split(' ').find(c => c.startsWith('text-')) || 'text-slate-600';
  const borderColor = textColor.replace('text-', 'bg-');

  return (
    <div className="group relative bg-slate-50/50 px-5 py-4 rounded-2xl border border-slate-100 hover:bg-white hover:border-slate-200 transition-all duration-300 flex items-center justify-between overflow-hidden shadow-sm">
      
      {/* Akses Garis Vertikal Halus di Sisi Kiri */}
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-r-md opacity-70 ${borderColor}`} />

      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 ${colorClass} bg-opacity-20`}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18, strokeWidth: 2.5 }) : icon}
        </div>
        
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            {title}
          </span>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              {value}
            </h3>
            {trend && (
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${borderColor.replace('bg-', 'bg-').replace('-500', '-100')} ${textColor}`}>
                {trend}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}