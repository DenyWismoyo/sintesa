// Lokasi file: src/components/common/Breadcrumbs.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  // Bangun Microdata Schema.org untuk Rich Snippet SEO Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Beranda',
        item: 'https://katalog.solotechnopark.id/'
      },
      ...items.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 2,
        name: item.label,
        item: item.href ? (item.href.startsWith('http') ? item.href : `https://katalog.solotechnopark.id${item.href}`) : undefined
      }))
    ]
  };

  return (
    <>
      {/* Schema.org Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav 
        aria-label="Breadcrumb" 
        className={`flex items-center text-xs text-slate-500 overflow-x-auto no-scrollbar py-1 ${className}`}
      >
        <ol className="flex items-center gap-1.5 whitespace-nowrap">
          {/* Root: Beranda */}
          <li className="flex items-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors p-1 rounded-md hover:bg-slate-100"
              title="Kembali ke Beranda"
            >
              <Home size={13} className="text-slate-400" />
              <span className="sr-only sm:not-sr-only text-[11px] font-medium">Beranda</span>
            </Link>
          </li>

          {/* Breadcrumb Items */}
          {items.map((item, index) => {
            const isLast = index === items.length - 1 || item.active;

            return (
              <li key={index} className="flex items-center gap-1.5">
                <ChevronRight size={12} className="text-slate-300 shrink-0" />
                {item.href && !isLast ? (
                  <Link 
                    href={item.href}
                    className="text-slate-500 hover:text-slate-900 font-medium transition-colors hover:underline"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span 
                    className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-xs md:max-w-md" 
                    aria-current={isLast ? 'page' : undefined}
                    title={item.label}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
