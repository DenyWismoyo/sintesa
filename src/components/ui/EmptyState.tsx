'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex flex-col items-center justify-center py-20 px-4 text-center w-full"
    >
      <div className="w-20 h-20 public-card flex items-center justify-center mb-5 relative overflow-hidden">
        <Icon className="h-10 w-10 text-slate-400 relative z-10" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5 tracking-tight">{title}</h3>
      <p className="text-slate-500 max-w-md mb-6 leading-relaxed text-xs sm:text-sm font-normal">{description}</p>
      {actionLabel && onAction && (
        <button 
          type="button"
          onClick={onAction} 
          className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}