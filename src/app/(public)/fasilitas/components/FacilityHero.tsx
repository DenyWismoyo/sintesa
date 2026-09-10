import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { ChevronRight, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function FacilityHero({ searchTerm, setSearchTerm, loadingAssets }: any) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUpVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
      <div>
        <div className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
           <Link href="/" className="hover:text-slate-800 transition-colors">Beranda</Link> <ChevronRight size={12}/> <span className="text-slate-700">Fasilitas</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Sewa Ruangan & Fasilitas</h1>
      </div>

      <div className="relative w-full md:w-80 shrink-0">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
         <Input 
            type="text" 
            placeholder="Cari ruangan atau gedung..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="pl-9 h-11 rounded-xl bg-white border-slate-200/80 shadow-sm focus-visible:ring-blue-500 text-sm transition-all" 
          />
          {loadingAssets && searchTerm && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 h-4 w-4 animate-spin" />
          )}
      </div>
    </motion.div>
  );
}