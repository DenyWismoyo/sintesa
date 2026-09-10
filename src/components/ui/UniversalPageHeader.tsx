import React from 'react';
import { Search, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  breadcrumbs: { label: string; href?: string }[];
  title: string;
  description?: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
}

export default function UniversalPageHeader({ 
  breadcrumbs, title, description, searchValue, onSearchChange, searchPlaceholder, isLoading 
}: HeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-200/50">
      <div className="flex-1">
        {/* Breadcrumb Elegan */}
        <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
          <Link href="/" className="hover:text-slate-900 transition-colors">Beranda</Link> 
          {breadcrumbs.map((bc, i) => (
            <React.Fragment key={i}>
              <ChevronRight size={12} className="text-slate-300"/>
              {bc.href ? (
                <Link href={bc.href} className="hover:text-slate-900 transition-colors">{bc.label}</Link>
              ) : (
                <span className="text-slate-900">{bc.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">{description}</p>}
      </div>

      {/* Search Bar Minimalis & Interaktif */}
      <div className="relative w-full md:w-96 shrink-0 group">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-slate-900 transition-colors" />
         <Input 
            type="text" 
            placeholder={searchPlaceholder || "Pencarian..."} 
            value={searchValue} 
            onChange={e => onSearchChange(e.target.value)} 
            className="pl-11 h-12 rounded-2xl bg-white border-slate-200 shadow-sm focus-visible:ring-4 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 text-sm transition-all w-full" 
          />
          {isLoading && searchValue && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 h-4 w-4 animate-spin" />
          )}
      </div>
    </div>
  );
}