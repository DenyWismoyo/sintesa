import React from 'react';

export type BadgeVariant = 
  | 'default' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'purple' 
  | 'emerald' 
  | 'amber' 
  | 'sky';

export interface StatusBadgeProps {
  status?: string;
  label?: string;
  variant?: BadgeVariant;
  pulse?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
  default: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  },
  success: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500'
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500'
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500'
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500'
  },
  danger: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500'
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500'
  },
  sky: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500'
  },
  purple: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500'
  }
};

const sizeStyles = {
  sm: 'text-[10px] px-2 py-0.5 gap-1 font-semibold rounded-full',
  md: 'text-xs px-2.5 py-1 gap-1.5 font-bold rounded-full',
  lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold rounded-full'
};

export default function StatusBadge({
  status,
  label,
  variant = 'default',
  pulse = false,
  icon,
  size = 'md',
  className = ''
}: StatusBadgeProps) {
  const displayLabel = label || status || '';
  const style = variantStyles[variant] || variantStyles.default;
  const sizeClass = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={`inline-flex items-center tracking-wide uppercase border backdrop-blur-sm transition-all shadow-xs ${style.bg} ${style.text} ${style.border} ${sizeClass} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.dot}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${style.dot}`} />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}
