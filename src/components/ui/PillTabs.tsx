'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface PillTabItem<T extends string = string> {
  key: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface PillTabsProps<T extends string = string> {
  tabs: (PillTabItem<T> | T)[];
  active: T;
  onChange: (key: T) => void;
  layoutId?: string;
  className?: string;
  containerClassName?: string;
  ariaLabel?: string;
}

export default function PillTabs<T extends string = string>({
  tabs,
  active,
  onChange,
  layoutId = 'sintesa-active-pill',
  className = '',
  containerClassName = '',
  ariaLabel = 'Tab Navigasi'
}: PillTabsProps<T>) {
  const normalizedTabs: PillTabItem<T>[] = tabs.map((tab) => {
    if (typeof tab === 'string') {
      return { key: tab as T, label: tab };
    }
    return tab;
  });

  return (
    <div className={`overflow-x-auto no-scrollbar py-1 max-w-full ${containerClassName}`}>
      <nav 
        role="tablist" 
        aria-label={ariaLabel} 
        className={`public-pill-container ${className}`}
      >
        {normalizedTabs.map((tab) => {
          const isActive = active === tab.key;

          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`public-pill-btn ${isActive ? 'active' : ''}`}
            >
              {isActive && (
                <motion.div
                  layoutId={layoutId}
                  className="public-pill-active-bg"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
