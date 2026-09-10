import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: number | string;
  suffix: string;
  colorClass: string;
}

export default function StatCard({ icon, title, value, suffix, colorClass }: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-extrabold text-slate-800">
          {value} <span className="text-sm font-normal text-slate-500">{suffix}</span>
        </h3>
      </div>
    </div>
  );
}