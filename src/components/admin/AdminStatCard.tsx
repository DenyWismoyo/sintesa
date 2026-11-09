"use client";

import React from 'react';
import Link from 'next/link';

export type AdminStatColor =
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'indigo'
  | 'rose'
  | 'purple'
  | 'sky'
  | 'teal'
  | 'slate';

export interface AdminStatCardProps {
  title?: string;
  label?: string;
  value: React.ReactNode;
  suffix?: string;
  subtitle?: React.ReactNode;
  subtext?: React.ReactNode;
  icon?: React.ReactNode | React.ComponentType<any>;
  color?: AdminStatColor;
  variant?: 'default' | 'solid' | AdminStatColor;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  className?: string;
}

const COLOR_STYLES: Record<
  AdminStatColor,
  {
    cardBg: string;
    iconBox: string;
    solidBg: string;
    solidText: string;
    valueText: string;
  }
> = {
  blue: {
    cardBg: 'bg-gradient-to-br from-blue-50/50 via-white to-white border-slate-200/90',
    iconBox: 'bg-blue-50 text-blue-600 border border-blue-100',
    solidBg: 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-600',
    solidText: 'text-blue-100',
    valueText: 'text-slate-900',
  },
  emerald: {
    cardBg: 'bg-gradient-to-br from-emerald-50/50 via-white to-white border-slate-200/90',
    iconBox: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    solidBg: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-600',
    solidText: 'text-emerald-100',
    valueText: 'text-slate-900',
  },
  amber: {
    cardBg: 'bg-gradient-to-br from-amber-50/50 via-white to-white border-slate-200/90',
    iconBox: 'bg-amber-50 text-amber-600 border border-amber-100',
    solidBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-500',
    solidText: 'text-amber-100',
    valueText: 'text-slate-900',
  },
  indigo: {
    cardBg: 'bg-gradient-to-br from-indigo-50/50 via-white to-white border-slate-200/90',
    iconBox: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    solidBg: 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-indigo-600',
    solidText: 'text-indigo-100',
    valueText: 'text-slate-900',
  },
  rose: {
    cardBg: 'bg-gradient-to-br from-rose-50/50 via-white to-white border-slate-200/90',
    iconBox: 'bg-rose-50 text-rose-600 border border-rose-100',
    solidBg: 'bg-gradient-to-br from-rose-600 to-red-700 text-white border-rose-600',
    solidText: 'text-rose-100',
    valueText: 'text-slate-900',
  },
  purple: {
    cardBg: 'bg-gradient-to-br from-purple-50/50 via-white to-white border-slate-200/90',
    iconBox: 'bg-purple-50 text-purple-600 border border-purple-100',
    solidBg: 'bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white border-purple-600',
    solidText: 'text-purple-100',
    valueText: 'text-slate-900',
  },
  sky: {
    cardBg: 'bg-gradient-to-br from-sky-50/50 via-white to-white border-slate-200/90',
    iconBox: 'bg-sky-50 text-sky-600 border border-sky-100',
    solidBg: 'bg-gradient-to-br from-sky-600 to-blue-700 text-white border-sky-600',
    solidText: 'text-sky-100',
    valueText: 'text-slate-900',
  },
  teal: {
    cardBg: 'bg-gradient-to-br from-teal-50/50 via-white to-white border-slate-200/90',
    iconBox: 'bg-teal-50 text-teal-600 border border-teal-100',
    solidBg: 'bg-gradient-to-br from-teal-600 to-emerald-700 text-white border-teal-600',
    solidText: 'text-teal-100',
    valueText: 'text-slate-900',
  },
  slate: {
    cardBg: 'bg-gradient-to-br from-slate-50/80 via-white to-white border-slate-200/90',
    iconBox: 'bg-slate-100 text-slate-600 border border-slate-200/80',
    solidBg: 'bg-gradient-to-br from-slate-800 to-slate-950 text-white border-slate-800',
    solidText: 'text-slate-300',
    valueText: 'text-slate-900',
  },
};

export function AdminStatCard({
  title,
  label,
  value,
  suffix,
  subtitle,
  subtext,
  icon,
  color,
  variant = 'default',
  active = false,
  href,
  onClick,
  rightElement,
  className = '',
}: AdminStatCardProps) {
  const resolvedColor: AdminStatColor =
    color ||
    (variant !== 'default' && variant !== 'solid' ? (variant as AdminStatColor) : 'blue');
  const palette = COLOR_STYLES[resolvedColor] || COLOR_STYLES.blue;
  const isSolid = variant === 'solid';
  const displayTitle = title ?? label ?? '';
  const displaySubtitle = subtitle ?? subtext;

  const renderedIcon = React.useMemo(() => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon)) {
      const IconComp = icon as React.ComponentType<{ className?: string }>;
      return <IconComp className="w-5 h-5" />;
    }
    return icon as React.ReactNode;
  }, [icon]);

  const cardInner = (
    <div
      onClick={onClick}
      className={`rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 shadow-2xs transition-all duration-200 flex items-center justify-between gap-2.5 sm:gap-3.5 ${
        isSolid ? palette.solidBg : palette.cardBg
      } ${active ? 'ring-2 ring-blue-500/80 border-blue-400 shadow-sm' : ''} ${href || onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''} ${className}`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
        {renderedIcon && (
          <div
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isSolid ? 'bg-white/15 text-white border border-white/20' : palette.iconBox
            }`}
          >
            {renderedIcon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate ${
              isSolid ? palette.solidText : 'text-slate-500'
            }`}
          >
            {displayTitle}
          </p>
          <div className="flex items-baseline gap-1.5 mt-0.5 min-w-0">
            <h3
              className={`text-base sm:text-xl md:text-2xl font-black tracking-tight truncate ${
                isSolid ? 'text-white' : palette.valueText
              }`}
            >
              {value}
            </h3>
            {suffix && (
              <span
                className={`text-[10px] sm:text-xs font-bold shrink-0 ${
                  isSolid ? palette.solidText : 'text-slate-400'
                }`}
              >
                {suffix}
              </span>
            )}
          </div>
          {displaySubtitle && (
            <div
              className={`text-[10px] sm:text-[11px] font-medium mt-0.5 truncate ${
                isSolid ? palette.solidText : 'text-slate-400'
              }`}
            >
              {displaySubtitle}
            </div>
          )}
        </div>
      </div>

      {rightElement && <div className="shrink-0">{rightElement}</div>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardInner}
      </Link>
    );
  }

  return cardInner;
}

export interface AdminStatGridProps {
  items?: AdminStatCardProps[];
  columns?: 2 | 3 | 4;
  children?: React.ReactNode;
  className?: string;
}

export function AdminStatGrid({
  items,
  columns = 4,
  children,
  className = '',
}: AdminStatGridProps) {
  const gridColClass =
    columns === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid ${gridColClass} gap-2.5 sm:gap-4 ${className}`}>
      {items
        ? items.map((item, idx) => <AdminStatCard key={item.title || idx} {...item} />)
        : children}
    </div>
  );
}

export default AdminStatCard;
